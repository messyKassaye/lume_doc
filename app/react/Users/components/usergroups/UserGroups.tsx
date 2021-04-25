import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { IImmutable } from 'shared/types/Immutable';
import { GroupMemberSchema, UserGroupSchema } from 'shared/types/userGroupType';
import { IStore } from 'app/istore';
import { UserGroupList } from 'app/Users/components/usergroups/UserGroupList';
import {
  deleteUserGroup,
  loadUserGroups,
  saveUserGroup,
} from 'app/Users/components/usergroups/actions/actions';
import { UserGroupSidePanel } from './UserGroupSidePanel';

export interface UserGroupProps {
  userGroups: IImmutable<UserGroupSchema[]>;
  users: IImmutable<GroupMemberSchema[]>;
  loadUserGroups: () => any;
  saveUserGroup: (userGroup: UserGroupSchema) => Promise<void>;
  deleteUserGroup: (userGroup: UserGroupSchema) => Promise<void>;
}

const UserGroupsComponent = ({
  userGroups,
  users,
  loadUserGroups: loadGroups,
  saveUserGroup: saveGroup,
  deleteUserGroup: deleteGroup,
}: UserGroupProps) => {
  const [sidePanelOpened, setSidePanelOpened] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<UserGroupSchema>();
  const groupList = userGroups ? userGroups.toJS() : [];
  const userList = users ? users.toJS() : [];

  useEffect(() => {
    if (groupList.length === 0) {
      loadGroups().then();
    }
  }, []);

  function closeSidePanel() {
    setSelectedGroup(undefined);
    setSidePanelOpened(false);
  }

  const handlers = {
    handleSelect: (userGroup: UserGroupSchema) => {
      setSelectedGroup(userGroup);
      setSidePanelOpened(true);
    },
    handleAddGroup: () => {
      setSelectedGroup({ name: '', members: [] });
      setSidePanelOpened(true);
    },
    handleSave: async (userGroup: UserGroupSchema) => {
      await saveGroup(userGroup);
      closeSidePanel();
    },
    handleDelete: async (userGroup: UserGroupSchema) => {
      await deleteGroup(userGroup);
      closeSidePanel();
    },
  };

  return (
    <>
      <UserGroupList
        userGroups={groupList}
        handleSelect={handlers.handleSelect}
        handleAddGroup={handlers.handleAddGroup}
        className={sidePanelOpened ? 'edition-mode' : ''}
      />
      {selectedGroup && (
        <UserGroupSidePanel
          key={selectedGroup._id ? selectedGroup._id.toString() : ''}
          userGroup={selectedGroup}
          users={userList}
          userGroups={groupList}
          opened={sidePanelOpened}
          closePanel={closeSidePanel}
          onSave={handlers.handleSave}
          onDelete={handlers.handleDelete}
        />
      )}
    </>
  );
};

const mapStateToProps = (state: IStore & { users: IImmutable<GroupMemberSchema[]> }) => ({
  userGroups: state.userGroups,
  users: state.users,
});

const mapDispatchToProps = {
  loadUserGroups,
  saveUserGroup,
  deleteUserGroup,
};

export const UserGroups = connect(mapStateToProps, mapDispatchToProps)(UserGroupsComponent);
