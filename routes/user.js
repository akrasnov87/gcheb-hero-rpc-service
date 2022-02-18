/**
 * @file routes/user.js
 * @project hero-rpc-service
 * @author Александр
 * @todo Открытые функции по работе с аккаунтами
 */

var express = require("express");
var router = express.Router();
var db = require('../modules/dbcontext');
var utils = require('../modules/utils');
var result_layout = require('mobnius-pg-dbcontext/modules/result-layout');
var authorizeDb = require('../modules/authorize/authorization-db');
var Console = require('../modules/log');
var generator = require('generate-password');
const args = require('../modules/conf')();
var authUtil = require('../modules/authorize/util');
var join = require('path').join;

var validator = require("email-validator");

module.exports = function (auth_type) {
    var authType = authUtil.getAuthModule(auth_type);
    router.use('/profile', authType.user(false));

    router.post('/login', login);
    router.get('/pwd-reset', pwdReset);
    router.post('/password-instruction-reset', passwordInstructionReset);

    return router;
}

/**
 * Процедура замены пароля для пользователя по электронному адресу
 * @example
 * GET ~/user/pwd-reset?email=[адрес эл. почты]&hash=[ключ]
 * @todo Исключения;
 * data not found - в базе данных информации не найдено;
 * request empty - параметры в запросе не указаны;
 * send error - общая ошибка отравки письма;
 * email invalid - адрес эл. почты не валиден;
 */
 function pwdReset(req, res) {
    var email = (req.query.email || '').trim();
    var hash = (req.query.hash || '').trim();

    if(email && hash) {
        email = Buffer.from(email, 'base64').toString();
        hash = Buffer.from(hash, 'base64').toString();

        db.provider.db().query('select id, c_login, c_password, s_hash from core.pd_users where c_email = $1 and (c_password = $2 or s_hash = $3);', [email, hash, hash], function(err, row) {
            if(err) {
                Console.error('Сброс пароля: ' + err.message, 'err');
            }
            
            if(row.rowCount == 1) {
                var item = row.rows[0];
                var _hash = item.s_hash || item.c_password;

                if(hash == _hash) {
                    var password = generator.generate({
                        length: 8,
                        numbers: true
                    });

                    authorizeDb.passwordReset(item.c_login, password, function(verify) {

                        db.table('core', 'pd_users', { user: { id: null, c_login: 'mobwal', c_claims: '' }}).Update({ id: item.id, d_last_change_password: new Date() }, function() {});
                        
                        utils.sendMail(
                            args.name, 
                            email, 
                            `<p>Доступ к ресурсу <b>${args.name}</b> восстановлен!!!<br />
                            <ul><li>Логин: ${item.c_login}</li><li>Пароль: ${password}</li></ul></p>`, 
                            function(err, info) {
                                if(err) {
                                    Console.error('Сброс пароля. Отправка письма: ' + err.message, 'err');
                                    res.json(result_layout.error(['send error']));
                                } else {
                                    res.redirect(args.site + '/arm' + args.virtual_dir_path);
                                }
                        });
                    });
                } else {
                    Console.debug('Сброс пароля: ключ ' + hash + ' в базе данных не найден');

                    res.json(result_layout.error(['key not found']));
                }
            } else {
                Console.debug('Сброс пароля: переданные данные email=' + email + ' и hash=' + hash + ' не найден в БД.');

                res.json(result_layout.error(['data not found']));
            }
        });
    } else {
        Console.debug('Сброс пароля: параметр email и hash не указаны');

        res.json(result_layout.error(['request empty']));
    }
}

/**
 * Инструкция по сбросу пароля для пользователей. Обязательным должно быть наличие электронной почты
 * @example
 * POST ~/user/password-instruction-reset
 * 
 * Body x-www-form-urlencoded
 * {
 *      c_email: string - адрес электронной почты
 * }
 * @todo Исключения;
 * email not found - адрес электронной почты не найден;
 * body is empty - тело запроса не указано;
 * send error - общая ошибка отравки письма;
 * email invalid - адрес эл. почты не валиден;
 */
 function passwordInstructionReset(req, res) {
    var email = req.body.c_email;

    if(email) {

        if(!validator.validate(email)) {
            Console.error('Восстановление пароля. ' + email + ' не валиден.', 'err');
            return res.json(result_layout.error(['email invalid']));
        }

        db.provider.db().query('select c_login, c_password, s_hash from core.pd_users where c_email = $1;', [email], function(err, row) {
            if(err) {
                Console.error('Восстановление пароля: ' + err.message, 'err');
            }
            
            if(row.rowCount > 0) {
                var message_text = '<ul>';

                if(row.rowCount > 0) {
                    for(var k = 0; k < row.rows.length; k++) {
                        var kItem = row.rows[k];
                        var hash = kItem.s_hash || kItem.c_password;
                        message_text += `<li>Для продолжения процедуры восстановления по логину <b>${kItem.c_login}</b> требуется перейти по <a href="${args.site}${args.virtual_dir_path}user/pwd-reset?email=${Buffer.from(email).toString('base64')}&hash=${Buffer.from(hash).toString('base64')}">ссылке</a></li>`;
                    }
                }

                message_text += '</ul>'

                utils.sendMail(
                    'Восстановление доступа к "' + args.name + '"', 
                    email, 
                    `На сайте "${args.name}" запущен механизм восстановления забытого пароля.
                    ${message_text}`,
                    function(err, info) {
                        if(err) {
                            Console.error('Восстановление пароля. Отправка письма: ' + err.message, 'err');
                            res.json(result_layout.error(['send error']));
                        } else {
                            res.json(result_layout.ok([email]));
                        }
                });
            } else {
                Console.debug('Восстановление пароля: адрес электронной почты ' + email + ' не найден.');

                res.json(result_layout.error(['email not found']));
            }
        });
    } else {
        Console.debug('Восстановление пароля: тело запроса не указано.');

        res.json(result_layout.error(['body is empty']));
    }
}

/**
 * Проверка на наличие логина
 * @example
 * POST ~/user/login
 * 
 * Body x-www-form-urlencoded
 * {
 *      c_login: string - Логин 
 * }
 * @todo Исключения;
 * bad query - ошибка SQL - запроса;
 * body is empty - тело запроса не указано;
 */
 function login(req, res) {
    var login = req.body.c_login;
    if(login) {
        db.provider.db().query('select count(*) from core.pd_users where c_login = $1;', [login], function(err, output) {
            if(err) {
                Console.error('Проверка наличия логина: ' + err, 'err');
            }
            
            res.json(result_layout.ok([output.rows[0].count == '1']));
        });
    } else {
        Console.debug('Проверка наличия логина: тело запроса не указано.');
        res.json(result_layout.error(['body is empty']));
    }
}