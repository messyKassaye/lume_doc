import mongoose from 'mongoose';

mongoose.Promise = Promise;

jasmine.createSpyObj = (name, methodNames) => {
  let names = methodNames;
  if (Array.isArray(name)) {
    names = name;
  }

  const obj = {};

  for (let i = 0; i < names.length; i += 1) {
    obj[names[i]] = jasmine.createSpy(names[i]);
  }

  return obj;
};
