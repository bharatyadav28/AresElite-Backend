const CamelcaseString = (str) => {
  const tempArray = str.split(" ");
  let result = "";
  result += tempArray[0].toLowerCase();
  for (let i = 1; i < tempArray.length; i++) {
    result += tempArray[i].charAt(0).toUpperCase() + tempArray[i].slice(1);
  }
  return result;
};

module.exports = CamelcaseString;
