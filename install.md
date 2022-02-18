Подробную инcтрукцию по установке и настройке сервиса смотреть на [OneDrive](https://1drv.ms/w/s!AnBjlQFDvsITgoM13WRav30J4TuIgA?e=0uR7hZ)

### Тестирование во вне

```
npm install -g localtunnel
lt --port 8000
```

### Загрузка на сервере

```
scp "D:\developer\lkk-sk\hero-rpc-service\hero-rpc-service.zip" a-krasnov@yantarenergo.it-serv.ru:/var/tmp/hero-rpc-service.zip
```

После обновления файлов не забываем обновлять каталог ``hero-rpc-service``

```
sudo chown -R www-data:www-data .
sudo chmod -R 777 .
```

### Настройка на Ubuntu 18.04 и выше

Полностью инструкция написана на странице http://tfs2017.compulink.local:8080/tfs/DefaultCollection/IServ.Mobile/_wiki/wikis/IServ.Mobile.wiki/1813/Настройка-RPC-сервиса