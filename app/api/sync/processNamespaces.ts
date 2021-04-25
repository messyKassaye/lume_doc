/* eslint-disable max-lines */
import sift from 'sift';
import { models, WithId } from 'api/odm';
import {
  SettingsSyncTemplateSchema,
  SettingsSyncRelationtypesSchema,
  Settings,
} from 'shared/types/settingsType';
import { ensure } from 'shared/tsUtils';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { settingsModel } from 'api/settings/settingsModel';
import templatesModel from 'api/templates/templatesModel';
import { TemplateSchema } from 'shared/types/templateType';
import entitiesModel from 'api/entities/entitiesModel';
import { EntitySchema } from 'shared/types/entityType';
import filesModel from 'api/files/filesModel';
import { FileType } from 'shared/types/fileType';

const noDataFound = 'NO_DATA_FOUND';

const namespaces = [
  'settings',
  'templates',
  'entities',
  'connections',
  'files',
  'dictionaries',
  'relationtypes',
  'translations',
] as const;
type NamespaceNames = typeof namespaces[number];
type MethodNames = NamespaceNames | 'default';

interface Options {
  change: { namespace: NamespaceNames; mongoId: ObjectIdSchema };
  templatesConfig: {
    [k: string]: SettingsSyncTemplateSchema;
  };
  relationtypesConfig: SettingsSyncRelationtypesSchema;
  whitelistedThesauri: Array<string>;
  whitelistedRelationtypes: Array<string>;
}

const getTemplate = async (template: string) => {
  const templateData = await templatesModel.getById(template);
  if (!templateData?._id) throw new Error('missing id');
  return templateData;
};

const getEntityTemplate = async (sharedId: string) => {
  const entitiesData = await entitiesModel.get({ sharedId });
  return entitiesData[0].template?.toString();
};

const extractAllowedMetadata = (
  { metadata }: WithId<EntitySchema>,
  templateData: WithId<TemplateSchema>,
  templateConfig: SettingsSyncTemplateSchema
) =>
  (templateData.properties || [])
    .filter(p => templateConfig.properties.includes((p._id || '').toString()))
    .map(p => p.name)
    .reduce(
      (prevMetadata, propertyName) => ({
        ...prevMetadata,
        [propertyName]: metadata?.[propertyName],
      }),
      {}
    );

class ProcessNamespaces {
  change: Options['change'];

  templatesConfig: Options['templatesConfig'];

  relationtypesConfig: Options['relationtypesConfig'];

  templatesConfigKeys: Array<string>;

  whitelistedThesauri: Options['whitelistedThesauri'];

  whitelistedRelationtypes: Options['whitelistedRelationtypes'];

  constructor({
    change,
    templatesConfig,
    relationtypesConfig,
    whitelistedThesauri,
    whitelistedRelationtypes,
  }: Options) {
    this.change = change;
    this.templatesConfig = templatesConfig;
    this.relationtypesConfig = relationtypesConfig;
    this.templatesConfigKeys = Object.keys(templatesConfig);
    this.whitelistedThesauri = whitelistedThesauri;
    this.whitelistedRelationtypes = whitelistedRelationtypes;
  }

  private async fetchData() {
    const { namespace, mongoId } = this.change;
    const data = await models[namespace].getById(mongoId);
    if (data) {
      return data;
    }

    throw new Error(noDataFound);
  }

  private async getTemplateDataAndConfig(template: string) {
    const templateData = await getTemplate(template);
    const templateConfig = this.templatesConfig[templateData._id.toString()];
    return { templateData, templateConfig };
  }

  private assessTranslationApproved(context: any) {
    const isSystem = context.id.toString() === 'System';
    const isApprovedRelationtype = this.whitelistedRelationtypes.includes(context.id.toString());
    const isApprovedThesauri = this.whitelistedThesauri.includes(context.id.toString());

    return Boolean(isSystem || isApprovedRelationtype || isApprovedThesauri);
  }

  private isPossibleRightMetadataRel(
    data: any,
    templateData: WithId<TemplateSchema>,
    hubOtherTemplates: WithId<TemplateSchema>[]
  ) {
    return hubOtherTemplates.reduce((_isRightRelationship: boolean, template) => {
      let isRightRelationship = _isRightRelationship;
      (template.properties || []).forEach(p => {
        if (
          p.type === 'relationship' &&
          p._id &&
          this.templatesConfig[template._id.toString()].properties.includes(p._id.toString())
        ) {
          const belongsToType =
            (p.relationType || '').toString() === (data.template ? data.template.toString() : null);
          const belongsToSpecificContent =
            (p.content || '').toString() === templateData._id.toString();
          const belongsToGenericContent = p.content === '';
          if (belongsToType && (belongsToSpecificContent || belongsToGenericContent)) {
            isRightRelationship = true;
          }
        }
      });

      return isRightRelationship;
    }, false);
  }

  private async shouldSkipRel(
    data: any,
    templateData: WithId<TemplateSchema>,
    templateHasValidRelationProperties: boolean
  ) {
    const hubOtherConnections = await models.connections.get({
      hub: data.hub,
      _id: { $ne: data._id },
    });

    const hubOtherEntities = await entitiesModel.get(
      { sharedId: { $in: hubOtherConnections.map(h => h.entity) } },
      'template'
    );

    const hubWhitelistedTemplateIds: Array<string> = hubOtherEntities
      .map(h => (h.template || '').toString())
      .filter(id => this.templatesConfigKeys.includes(id));

    const hubOtherTemplates = await templatesModel.get({
      _id: { $in: hubWhitelistedTemplateIds },
    });

    const belongsToWhitelistedType = this.relationtypesConfig.includes(
      data.template ? data.template.toString() : null
    );

    const isPossibleLeftMetadataRel = templateHasValidRelationProperties && !data.template;
    const isPossibleRightMetadataRel = this.isPossibleRightMetadataRel(
      data,
      templateData,
      hubOtherTemplates
    );

    return !belongsToWhitelistedType && !isPossibleLeftMetadataRel && !isPossibleRightMetadataRel;
  }

  private async default() {
    const data = await this.fetchData();
    return { data };
  }

  private async settings() {
    const { mongoId } = this.change;
    const data = ensure<WithId<Settings>>(await settingsModel.getById(mongoId), noDataFound);
    return { data: { _id: data._id, languages: data.languages } };
  }

  private async templates() {
    const templateConfig = this.templatesConfig[this.change.mongoId.toString()];

    if (!templateConfig) {
      return { skip: true };
    }

    const { mongoId } = this.change;
    const data = ensure<WithId<TemplateSchema>>(await templatesModel.getById(mongoId), noDataFound);

    if (data.properties) {
      const templateConfigProperties = this.templatesConfig[data._id.toString()].properties;
      data.properties = data.properties.filter(property =>
        templateConfigProperties.includes(property._id?.toString() || '')
      );
    }

    return { data };
  }

  private async entities() {
    const { mongoId } = this.change;
    const data = ensure<WithId<EntitySchema>>(await entitiesModel.getById(mongoId), noDataFound);

    if (!(data.template && this.templatesConfigKeys.includes(data.template.toString()))) {
      return { skip: true };
    }

    const { templateData, templateConfig } = await this.getTemplateDataAndConfig(
      data.template.toString()
    );

    if (templateConfig.filter) {
      if (!sift(JSON.parse(templateConfig.filter))(data)) {
        return { skip: true };
      }
    }

    data.metadata = extractAllowedMetadata(data, templateData, templateConfig);

    return { data };
  }

  private async connections() {
    const data = await this.fetchData();
    const entityTemplate = await getEntityTemplate(data.entity);

    const belongsToValidEntity = this.templatesConfigKeys.includes(entityTemplate || '');
    const templateData = await templatesModel.getById(entityTemplate);

    if (!belongsToValidEntity || !templateData) {
      return { skip: true };
    }

    const templateConfigProps = this.templatesConfig[templateData._id.toString()].properties;
    const templateHasValidRelationProperties = (templateData.properties || []).reduce(
      (hasValid: boolean, p) => {
        const isValid =
          p.type === 'relationship' && templateConfigProps.includes(p._id?.toString() || '');
        return isValid || hasValid;
      },
      false
    );

    const shouldSkipRel = await this.shouldSkipRel(
      data,
      templateData,
      templateHasValidRelationProperties
    );

    return shouldSkipRel ? { skip: true } : { data };
  }

  private async files() {
    const { mongoId } = this.change;
    const data = ensure<WithId<FileType>>(await filesModel.getById(mongoId), noDataFound);

    if (data.entity) {
      const [entity] = await entitiesModel.get({ sharedId: data.entity });

      if (!this.templatesConfigKeys.includes(entity.template?.toString() || '')) {
        return { skip: true };
      }
    }

    return { data };
  }

  private async dictionaries() {
    if (!this.whitelistedThesauri.includes(this.change.mongoId.toString())) {
      return { skip: true };
    }

    return this.default();
  }

  private async relationtypes() {
    if (!this.whitelistedRelationtypes.includes(this.change.mongoId.toString())) {
      return { skip: true };
    }

    return this.default();
  }

  private async translations() {
    const data = await this.fetchData();
    const templatesData = await templatesModel.get({
      _id: { $in: this.templatesConfigKeys },
    });

    data.contexts = data.contexts
      .map((context: any) => {
        if (this.assessTranslationApproved(context)) {
          return context;
        }

        if (this.templatesConfigKeys.includes(context.id.toString())) {
          const contextTemplate = ensure<WithId<TemplateSchema>>(
            templatesData.find(t => t._id.toString() === context.id.toString())
          );
          const templateConfigProperties = this.templatesConfig[context.id.toString()].properties;
          const templateTitle = contextTemplate.commonProperties?.find(p => p.name === 'title')
            ?.label;

          const approvedKeys = [contextTemplate.name, templateTitle]
            .concat(
              (contextTemplate.properties || [])
                .filter(p => templateConfigProperties.includes(p._id?.toString() || ''))
                .map(p => p.label)
            )
            .filter(k => Boolean(k));

          context.values = (context.values || []).filter((v: any) => approvedKeys.includes(v.key));
          return context;
        }

        return null;
      })
      .filter((c: any) => Boolean(c));

    return { data };
  }

  public async process() {
    const { namespace } = this.change;
    let method: MethodNames = namespace;
    if (!namespaces.includes(namespace)) {
      method = 'default';
    }

    try {
      return await this[method]();
    } catch (err) {
      if (err.message === noDataFound) {
        return { skip: true };
      }
      throw err;
    }
  }
}

export { ProcessNamespaces };
