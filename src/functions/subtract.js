const util = require('util'),
      set = require('lodash.set'),
      get = require('lodash.get');
module.exports = function(ID, data, options = {}, db) {
  const getInfo = new Promise((resolve, error) => {
    if (typeof data !== 'number') return error(new TypeError('.subtract() data is not a number.'));
    // Configure Options
    options = {
      target: options.target || undefined,
      table: options.table || 'json'
    };
    let response;
    function createDb() {
      db.prepare(`CREATE TABLE IF NOT EXISTS ${options.table} (ID TEXT, json TEXT)`).run();
      checkIfCreated(true);
    }
    function checkIfCreated(updated) {
      // Fetch Row
      let fetched = db.prepare(`SELECT * FROM ${options.table} WHERE ID = (?)`).get(ID);
    
      if (!fetched || !fetched.json && !updated) insertRow();
      else {
        console.log(fetched)
        fetched = fetched.json;
        let json;
        if (fetched === '{}' && !options) json = 0;
        else json = JSON.parse(fetched);
        if (typeof json === 'number' || (fetched === '{}' && typeof json === 'object')) db.prepare(`UPDATE ${options.table} SET json = (?) WHERE ID = (?)`).run((fetched === '{}' ? 0 : json) - data, ID);
        else {
          if (typeof json === 'object' && options && options.target) {
            let targets = options.target;
            if (targets[0] === '.') targets = targets.slice(1);
            let target = get(json, targets);
            if (typeof target === 'number' || target == undefined) {
              if (target == undefined) target = 0;
              let input = set(json, targets, target - data);
              util.inspect(input);
              input = JSON.stringify(input);
              db.prepare(`UPDATE ${options.table} SET json = (?) WHERE ID = (?)`).run(input, ID);
            } else error(new TypeError(`Target for .subtract(${ID}, ${data}) is not a number.`));
          } else error(new TypeError(`Target for .subtract(${ID}, ${data}) is not a number.`));
        }
        let newData = db.prepare(`SELECT * FROM ${options.table} WHERE ID = (?)`).get(ID).json;
        if (newData === '{}') response = null;
        else response = JSON.parse(newData);
        returnDb();
      }
    }
    function insertRow() {
      db.prepare(`INSERT INTO ${options.table} (ID,json) VALUES (?,?)`).run(ID, '{}');
      checkIfCreated(true);
    }
    function returnDb() {
      return resolve(response);
    }
    createDb();
  });
  return getInfo;
};
