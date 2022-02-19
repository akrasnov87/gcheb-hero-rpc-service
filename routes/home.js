/**
 * @file routes/home.js
 * @project hero-rpc-service
 * @author Александр
 * @todo Домашняя страница
 */

var express = require("express");
var router = express.Router();
var pkg = require('../package.json');
var moment = require('moment');
var result_layout = require('mobnius-pg-dbcontext/modules/result-layout');

var db = require('../modules/dbcontext');
var Console = require('../modules/log');
const args = require('../modules/conf')();

module.exports = function () {
    router.get("/", home);
    router.get('/sitemap.xml', sitemap);
    router.get('/rss.xml', rss);
    router.get('/:feed/rss.xml', rss);

    return router;
}

function rss(req, res) {
    var feed = req.params.feed;
    var month = req.query.month || (new Date().getMonth() + 1);
    
    res.set('Content-Type', 'text/xml');

    db.provider.db().query(`select * from core.sd_settings where c_key = 'RSS_DESCRIPTION';`, null, function(err, settingData) {
        var description = settingData.rows[0].c_value;

        db.provider.db().query(`select * from dbo.sf_feed_rss($1, $2);`, [feed, month], function(err, data) {
            if(err) {
                Console.error(`Ошибка чтения sf_feed_rss: ${err.toString()}.`, 'err');
                res.json(result_layout.error(['bad query']));
            } else {
                var records = data.rows;

                var items = [];

                for(var i = 0; i < records.length; i++) {
                    var record = records[i];
                    
                    var item = {
                        link: `${args.site}/#profile/${record.id}`,
                        title: `${record.c_first_name} ${record.c_last_name} ${record.c_middle_name}`,
                        author: record.c_author,
                        category: record.c_category,
                        pubDate: record.d_pub_date,
                        description: record.c_content,
                        comments: record.c_about,
                        img: `${args.site}/file/${record.id}`
                    }

                    items.push(item);
                }

                // тут информация прочитана
                res.render('rss', {
                    site: args.site,
                    description: description,
                    items: items
                });
            }
        });
    });
}
 
function sitemap(req, res) {
    res.set('Content-Type', 'text/xml');

    db.provider.db().query(`select d.id, d.d_change_date, d.d_created_date, d.c_image_path, d.c_first_name, d.c_last_name, d.c_middle_name 
                            from dbo.dd_documents as d 
                            where d.b_disabled = false 
                            order by d.c_first_name, d.c_last_name, d.c_middle_name, d.d_birth_day;`, null, function(err, data) {
        if(err) {
            Console.error(`Ошибка чтения dd_documents: ${err.toString()}.`, 'err');
            res.render('sitemap', { items: [], err: 'bad query' });
        } else {
            var records = data.rows;

            var urls = [];

            for(var i = 0; i < records.length; i++) {
                var record = records[i];
                var url = {
                    loc: `${args.site}/#profile/${record.id}`,
                    lastmod: moment(record.d_change_date || record.d_created_date).format('YYYY-MM-DD')
                };

                if(record.c_image_path) {
                    url.image = {
                        src: `${args.site}/file/${record.id}`,
                        title: `${record.c_first_name} ${record.c_last_name} ${record.c_middle_name}`
                    }
                }

                urls.push(url);
            }

            // тут информация прочитана
            res.render('sitemap', {
                items: urls,
                err: null
            });
        }
    });
}

/**
 * Домашняя страница
 * 
 * @example
 * GET ~/
 */
function home(req, res) {
   res.render('index', {
       version: pkg.version,
       date: moment(new Date()).format('DD.MM.YYYY HH:mm:ss')
   });
}

function normalUrl(url) {
    return url.replace(/&/g, '&amp;');
}