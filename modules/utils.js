/**
 * @file modules/utils.js
 * @project hero-rpc-service
 * @author Александр Краснов
 */

var args = require('./conf')();
const process = require('process');
const nodemailer = require('nodemailer');

/**
 * Отправка почтового сообщения
 * @param {string} subject тема письма
 * @param {string} to список адресов электронной почты через запятую
 * @param {string} body текст письма
 * @param {function} callback результат отправки
 */
exports.sendMail = function(subject, to, body, callback) {
    let transporter = nodemailer.createTransport({
        auth: {
            user: args.mail_auth_user,
            pass: args.mail_auth_pwd
        },
        host: args.mail_host,
        port: args.mail_port,
        secure: args.mail_secure
    });
    transporter.sendMail({
        from: args.mail_auth_user,
        to: to,
        subject: subject,
        html: body
    }, callback);
}

/**
 * Получение текущего хоста
 * @returns {string}
 */
exports.getCurrentHost = function() {
    return 'process:' + process.pid;
}

/**
 * заголовок для авторизации
 * @returns строка
 */
exports.getAuthorizationHeader = function() {
    return "rpc-authorization";
}