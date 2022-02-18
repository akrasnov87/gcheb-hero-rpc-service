/**
 * @file routes/file.js
 * @project hero-rpc-service
 * @author Александр
 * 
 * @todo операции для работы с файловой системой
 */

var express = require("express");
var router = express.Router();
var db = require('../modules/dbcontext');
var result_layout = require('mobnius-pg-dbcontext/modules/result-layout');
var Console = require('../modules/log');
const args = require('../modules/conf')();

var fs = require('fs');
var pth = require('path');
var join = pth.join;
var fx = require('mkdir-recursive');
var uuid = require('uuid');

module.exports = function () {
    router.get('/:id', getStorageItem);
    router.post('/upload', uploadFile);

    return router;
}

/**
 * Получение файла из хранилища по идентификатору
 * @example
 * GET ~/file/:id
 * 
 * @todo Исключения;
 * id not found - идентификатор не указан;
 * bad query - ошибка запроса в БД;
 * file not found - файл не найден;
 */
function getStorageItem(req, res) {
    var id = req.params.id;
    if(id) {
        db.provider.db().query('select c_dir, c_name, c_mime from dbo.sd_storages where id = $1;', [id], function(err, row) {
            if(err) {
                Console.error(`Получение файла: ${err.toString()}.`, 'err');

                res.json(result_layout.error(['bad query']));
            } else {
                if(row) {
                    var record = row.rows[0];
                    var file = join(args.storage, record.c_dir, record.c_name);
                    if(file.indexOf(args.storage) == 0 && fs.existsSync(file)) {
                        res.setHeader('Content-Disposition', `attachment; filename=${encodeURI(record.c_name)}`);
                        res.setHeader("Content-Type", record.c_mime);
                        return res.sendFile(file);
                    }
                } 

                res.json(result_layout.error(['file not found']));
            }
        });
    } else {
        Console.debug(`Получение файла: идентификатор не указан.`);

        res.json(result_layout.error(['id not found']));
    }
}

/**
 * Загрузка файла
 * @example
 * POST ~/file/upload
 * 
 * Headers
 * rpc-authorization: Token
 * Content-Type: application/json
 * 
 * Body form-data
 * {
 *      file: bytes - вложенный файл
 *      path: string - путь для хранения, например /temp/readme.md. По умолчанию будет установлено имя вложенного файла
 * }
 * 
 * @todo Исключения;
 * file not found - файл не найден;
 * bad path - указан неверный путь;
 * file or path not found - файл или путь для хранения не указаны;
 * error write file - ошибка записи файла в файловую систему;
 * error save db - ошибка сохранения информации в базе данных;
 */
function uploadFile(req, res) {
    if(!req.files) {
        Console.debug(`Загрузка данных: файл не найден.`);
        return res.json(result_layout.error(['file not found']));
    }

    var file = req.files.file;
    var dt = new Date();
    var path = join(req.body.path || join(dt.getFullYear().toString(), (dt.getMonth() + 1).toString(), dt.getDate().toString(), file.name));

    if(file && path) {
        var filePath = join(args.storage, path);
        if(filePath.indexOf(args.storage) == 0) {
            var dirName = pth.dirname(filePath);

            if(!fs.existsSync(dirName)) {
                // если каталога нет, то он будет создан автоматически
                fx.mkdirSync(dirName);
            }

            fs.writeFile(filePath, file.data, (err) => {
                if(err) {
                    Console.error(`Загрузка данных: ${err.toString()}`, 'err');

                    fs.unlinkSync(filePath);
                    return res.json(result_layout.error(['error write file']));
                } else {
                    var id = uuid.v4();
                    // файл записали

                    db.table('dbo', 'sd_storages', {}).Add({ 
                        id: id,
                        c_name: file.name,
                        c_dir: dirName.replace(args.storage, ''),
                        n_length: file.size,
                        d_date: new Date(),
                        c_mime: file.mimetype
                    }, function(output) {
                        if(!output.meta.success) {
                            Console.error(`Загрузка данных: задан не корректный путь для хранения ${path}`, 'err');
                            fs.unlinkSync(filePath);

                            res.json(result_layout.error(['error save db']));
                        } else {
                            res.json(result_layout.ok([id]));
                        }
                    });
                }
            });
        } else {
            Console.debug(`Загрузка данных: задан не корректный путь для хранения ${path}`);
            res.json(result_layout.error(['bad path']));
        }
    } else {
        Console.debug(`Загрузка данных: файл или путь не указаны`);
        res.json(result_layout.error(['file or path not found']));
    }
}