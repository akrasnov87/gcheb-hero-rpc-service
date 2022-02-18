/**
 * @file modules/custom-context/shell.js
 * @project hero-rpc-service
 * @author Александр
 */

/**
 * объект для формирования ответа
 */
var result_layout = require('mobnius-pg-dbcontext/modules/result-layout');
var db = require('../dbcontext');
var uuid = require('uuid');

/**
 * Объект с набором RPC функций
 */
exports.shell = function (session) {

    return {

        /**
         * Получение серверного времени
         * @param {*} data 
         * @param {*} callback 
         * 
         * @example
         * [{ action: "shell", method: "servertime", data: [{ }], type: "rpc", tid: 0 }]
         */
        servertime: function (data, callback) {
            callback(result_layout.ok([{ date: new Date() }]));
        },

        /**
         * Получение настройки для веб-интерфейса WEB_
         * @param {*} data 
         * @param {*} callback 
         * 
         * @example
         * [{ action: "shell", method: "websettings", data: [{ }], type: "rpc", tid: 0 }]
         */
        websettings: function(data, callback) {
            getSettings('WEB_', session, callback);
        },

        /**
         * Получение дочерних подчиненных уровней
         * @param {*} data 
         * @param {*} callback 
         * 
         * @example
         * [{ action: "shell", method: "levels", data: [{ }], type: "rpc", tid: 0 }]
         */
        levels: function(data, callback) {
            var level = session.user.f_level;

            db.func('core', 'pf_levels', session).Query({params: [level]}, (output) => {
                callback(output);
            });
        },

        /**
         * Получение всех подчиненных уровней включая текущий
         * @param {*} data 
         * @param {*} callback 
         * 
         * @example
         * [{ action: "shell", method: "alllevels", data: [{ }], type: "rpc", tid: 0 }]
         */
        alllevels: function(data, callback) {
            var level = session.user.f_level;

            db.func('core', 'pf_all_levels', session).Query({params: [level]}, (output) => {
                callback(output);
            });
        },

        /**
         * Получение списка подчиненных пользователей
         * @param {*} data 
         * @param {*} callback 
         * 
         * @example
         * [{ action: "shell", method: "users", data: [{ }], type: "rpc", tid: 0 }]
         */
        users: function(data, callback) {
            var level = session.user.f_level;

            db.func('core', 'sf_level_users', session).Query({ params: [level]}, (output) => {
                callback(output);
            });
        },

        /**
         * Получение информации о дочернем пользователе
         * @param {*} data 
         * @param {*} callback 
         * 
         * @example
         * [{ action: "shell", method: "childuser", data: [{ params: [userID] }], type: "rpc", tid: 0 }]
         */
        childuser: function(data, callback) {
            var level = session.user.f_level;

            db.func('core', 'sf_level_users', session).Select({ params: [level], filter: [{ "property": "id", "value": data.params[0] }] }, (output) => {
                callback(output);
            });
        }
    }
}

function getSettings(key, session, callback) {
    db.table('core', 'sd_settings', session).Query({ filter: [
        { "property": "c_key", "operator": "ilike", "value": key }
    ]}, function(output) {
        var data = {}
        var records = output.result.records;
        if (output.meta.success) {
            for(var i = 0; i < records.length; i++) {
                var record = records[i];

                switch(record.c_type) {// TEXT, INT, BOOL, DATE
                    case 'INT':
                        data[record.c_key] = parseInt(record.c_value)
                        break;

                    case 'BOOL':
                        data[record.c_key] = (record.c_value || 'true').toLowerCase() == 'true'
                        break;

                    case 'DATE':
                        data[record.c_key] = new Date(record.c_value || '')
                        break;

                    default:
                        data[record.c_key] = record.c_value;
                        break;
                }
            }
            callback(result_layout.ok([data]));
        } else {
            callback(result_layout.error([]));
        }
    });
}