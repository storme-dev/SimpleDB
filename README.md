# SimpleDB

## Как начать использовать?

1. Скачиваем db.js файл из репозитория
2. Размещаем его в любую папку вашего проекта
3. Подключаем модуль require('./db')

## Пример кода
```js
    const { SimpleDB } = require('./db')
    
    const db = new SimpleDB('dbname') // создаёт БД если её нет.Если есть, то загружает её
    
    db.createTable('users', { id: 0, name: '', age: 18 }) // создаёт таблицу в БД, если её нет.Второй аргумент - структура таблицы, где ключи - названия полей, значения - значения по умолчанию
    db.insert('users', {
        id: 0,
        username: 'Alex'
    }) // создадим новую запись.Т.к. поле age не указано, оно будет равно 18
    
    let array = db.select('users', ['id', 'username'], user => {
        if(user.name == 'Alex') return true
    }) // Здесь мы делаем выборку из записей таблицы users.Данная выборка выдаст массив всех пользователей, имя которых Alex

    db.update('users', { name: 'AlexChanged' }, user => {
        if(user.name == 'Alex') return true
    }) // здесь мы изменяем значение name на AlexChanged для всех записей, у которых поле name равно Alex
```
