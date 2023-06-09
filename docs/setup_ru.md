# Подготовка проекта к запуску

## Установка

- Клонируйте этот репозиторий:

```bash
git clone https://github.com/shadowplay1/tests-app
```
или скачайте его в архиве ZIP.


### На Windows:
- Запустите файл `./scripts/install.ps1` от имени администратора.

### На Linux:
- Запустите файл `./scripts/install.sh` с правами суперпользователя (sudo).

> Скрипт установит Node.js, зависимости проекта и создаст файл `.env` для дальнейшего заполнения всех данных.


# Заполнение данных

## Подключение к БД
Данный проект использует базу данных **MongoDB**. Здесь расписано подробное руководство по созданию **MongoDB-кластера** и получения его специальной ссылки (`URI`) для подключения.

1. Создайте аккаунт на сайте [MongoDB](https://mongodb.com).

2. После входа в аккаунт нажмите кнопку "Create a new cluster" ("Создать новый кластер").

3. Выберите подходящую опцию тарификации и настройте параметры кластера. Нажмите "Create Cluster" ("Создать кластер") после завершения настройки.

4. Дождитесь, пока кластер будет развёрнут. Это может занять несколько минут.

5. После развёртывания кластера перейдите на вкладку "Clusters" ("Кластеры") в левом меню. Найдите свой кластер и нажмите на кнопку "Connect" ("Подключиться").

6. Выберите способ подключения. Можно выбрать "Connect your application" ("Подключить своё приложение"), чтобы получить URI для подключения.

7. Выберите язык программирования и версию драйвера, затем скопируйте URI.

8. Вставьте скопированный URI в файл `.env` в поле `MONGODB_URI`.


## Отправка писем
Отправка писем необходима для манипуляций с аккаунтом, такие как **его активация** и **смена пароля**. Здесь расписано подробное руководство по получению специальных данных, которые позволят приложению отправлять электронные письма. Для примера будет использован сервис `gmail`.

1. Зайдите в свой аккаунт Gmail и перейдите [в настройки безопасности вашей учетной записи Google](https://myaccount.google.com/security).

2. Перейдите на страницу "Пароли приложений".

3. Авторизуйтесь в Google ещё раз, если потребуется.

4. Выберите "Почта" как приложение и "Другое" как устройство.

5. Введите название приложению, например, "my_app".

6. Нажмите "Сгенерировать".

7. Скопируйте 16-значный пароль приложения.

8. Введите электронную почту, использованную для создания пароля приложения в файл `.env`, в поле `MAILER_EMAIL`.

9. Вставьте сгенерированный 16-значный пароль приложения в файл `.env`, в поле `MAILER_PASSWORD`.


# Запуск проекта

## Сервер разработки (Development Server)
Запустите файл `scripts/start.sh` (для Linux) или файл `scripts/start.ps1` (для Windows) чтобы запустить сервер разработки.

- После запуска сервера перейдите по ссылке [https://localhost:3000](https://localhost:3000) для просмотра сайта.
