### Описание

Документация с описанием базы данных расположена по адресу https://gcheb.mobwal.com/hero-dev-db.html (ссылка является временной, т.к. будет изменено доменное имя)


### Основные запросы

#### Работа с документами и файловой системой

Создание документа в базе данных производиться путем вызова функции POST ~/file/upload (https://docs.appcode.pw/docs?project=hero-rpc-service&file=routes/file.js)

В запросе нужно передать все обязательные поля, которые указаны для таблицы [dd_documents](https://gcheb.mobwal.com/hero-dev-db.html#dbo.table.dd-documents)

Для получения изображения по документу нужно вызвать GET ~/file/[documentID]

#### инициализация приложения

```
nodejs conf=/etc/path/prod.conf
```

По умолчанию используется порт 5000, но можно указать любой свободный.
При указание дополнительного аргумента debug будет сохраняться отладочная информация, но на боевом стенде лучше отключать, чтобы не засорять логи.
По умолчанию информация логируется в каталоге ~/logs.

```
# {port} - порт, на котором будет работать приложение
port=5000
# {virtual_dir_path} - виртуальный каталог, например /test (обращение будет http://my.domain.ru/test)
virtual_dir_path="/"
# {connection_string} - строка подключения к БД
connection_string="host:dev-db-v-10;port:5432;user:****;password:****;database:hero-dev-db"
# {debug} - ставить true если нужна информация для отладки приложения
debug=true 
# {thread} - количество потоков, если передать 0, то равно количеству ядер 
thread=1
# {name} - имя ресурса
name="Наименование"
# {access_buffer_expire} - период времени для хранение ключа безопасности в кэше (секунды)
access_buffer_expire=30
# {access_checkperiod} - период времени для проверки истекших ключей безопасности (секунды)
access_checkperiod=60
# {user_auth_expire} - период времени для хранение ключа авторизации в кэше (секунды)
user_auth_expire=15
# {user_checkperiod} - период времени для проверки истекших ключей авторизации (секунды)
user_checkperiod=30
# {query_limit} - лимит выборки из базы данных для одного запроса
query_limit=10000
# {mail_auth_user} - логин для авторизации на почтовом сервере
mail_auth_user="sender@mail.com"
# {mail_auth_pwd} - пароль для авторизации на почтовом сервере
mail_auth_pwd="****"
# {mail_host} - SMTP - сервер
mail_host="smtp.yandex.ru"
# {mail_port} - порт подключения
mail_port=465
# {mail_secure} - используется ли безопасное соединение
mail_secure=true
# {max_file_size} - максимальный размер данных
max_file_size="1mb"
# {site} - адрес основного сайта
site="https://domain.com"
# {storage} - хранилище пользовательских файлов
storage="/var/www/files"
```

#### соглашение об назначении версии приложения

В файле package.json есть свойство birthday в котором указывать "дата рождения приложения" на основе этой даты генерируется значение свойства version.
Дле генерации требуется установить расширение [node-version-1.0.1.vsix](https://1drv.ms/u/s!AnBjlQFDvsIT731gHXGyySlxy0VB?e=DIpfjT)

#### автодокументирование

Дле генерации документации требуется установить расширение [docdash-plugin-1.0.11.vsix](https://1drv.ms/u/s!AnBjlQFDvsIThP04wNC8iC4vxFmhsw?e=7Fe2B0)

#### настройка в VSCode

```
.vscode/launch.json

{
    // Используйте IntelliSense, чтобы узнать о возможных атрибутах.
    // Наведите указатель мыши, чтобы просмотреть описания существующих атрибутов.
    // Для получения дополнительной информации посетите: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "type": "pwa-node",
            "request": "launch",
            "name": "Launch Program",
            "skipFiles": [
                "<node_internals>/**"
            ],
            "program": "${workspaceFolder}\\bin\\www",
            "args": ["conf=./dev.conf"]
        }
    ]
}
```