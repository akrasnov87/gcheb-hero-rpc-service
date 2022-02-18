/**
 * @file modules/log/index.js
 * @project hero-rpc-service
 * @author Александр Краснов
 */

var log4js = require('./logToFile');
var args = require('../conf')();

/**
 * Лог
 * @param {string} message текст
 * @param {string} category категория
 */
exports.log = function (message, category) {
    log4js.getLogger(category).info(message);  
    if (args.debug) { 
        console.log(message);
    }
}

/**
 * Отладка
 * @param {string} message текст
 * @param {string} category категория
 */
exports.debug = function (message, category) {
    if (args.debug) {
        console.debug(message);
        log4js.getLogger(category).debug(message);
    }
}

/**
 * Ошибка
 * @param {string} message текст
 * @param {string} category категория
 */
exports.error = function (message, category) {
    log4js.getLogger(category).error(message);
    console.error(message);
}