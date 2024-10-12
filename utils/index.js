// Filter object when updating user profile
exports.filterBodyObject = (bodyObject, ...excludedFields) => {
  const bodyOjectCopy = { ...bodyObject };

  excludedFields.forEach((field) => delete bodyOjectCopy[field]);

  return bodyOjectCopy;
};
