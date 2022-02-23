/**
 * @file routes/report.js
 * @project hero-rpc-service
 * @author Александр
 * @todo Построение отчетов
 */

 var express = require("express");
 var router = express.Router();
 const args = require('../modules/conf')();
 var authUtil = require('../modules/authorize/util');
 const https = require('https');
 const http = require('http');
 var Console = require('../modules/log');
 
 module.exports = function (auth_type) {
     var authType = authUtil.getAuthModule(auth_type);
     router.use('/', authType.user(false));
 
     router.get('/:path', build);
 
     return router;
 }
 
 /**
  * Построение отчета с применением внутренней авторизации. Требуется заполнить настройки с наименованием report_*
  * @example
  * GET ~/report/:path?target=[application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | pageable/pdf]
  * 
  * Headers
  * rpc-authorization: Token
  * Content-Type: application/json
  * 
  * @todo Исключения;
  * bad query - ошибка построения отчетов;
  */
 function build(req, res) {
     var query = 'f_user=' + res.user.id + '&';
     for(var i in req.query) {
         if(i == 'f_user' || i == 'target') {
             continue;
         }
         query += i + '=' + req.query[i] + '&';
     }
     var url = args.report_url.replace('{0}', req.params.path).replace('{1}', query) + `userid=${args.report_userid}&password=${args.report_password}&output-target=${req.query.target || args.report_output}` + (args.report_output_page_mode && !req.query.target ? `;page-mode=${args.report_output_page_mode}` : '');
     
     getResponse(url, req, res);
 }
 
 /**
  * Приватная функция. Загрузка отчета из Pentaho
  * 
  * @param {string} url адрес построения отчета
  */
 function getResponse(url, req, res) {
     var buffers = [];
     (url.indexOf('http://') == 0 ? http : https).get(url, (response) => {
       
         // called when a data chunk is received.
         response.on('data', (chunk) => {
             buffers.push(chunk);
         });
       
         // called when the complete response is received.
         response.on('end', () => {
             const buf = Buffer.concat(buffers);
             res.writeHead(200, { 'Content-Type': req.query.target == 'pageable/pdf' ? 'application/pdf' : args.report_mime_type });
             res.write(buf);
             res.end();
         });
       
     }).on('error', (error) => {
         Console.error(`Построение отчета: ${error.toString()}`, 'err');
 
         res.json(result_layout.error(['bad query']));
     });
 }