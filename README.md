# ROgscript

Mail2ROlead.gs - скрипт для создания лидов (обращений) в РемОнлайн из входящих писем в gmail

ROgtables.gs - срипт-библиотека для google-таблиц. для использования - в новой таблице заходим в "инструменты" - "редактор скриптов" и созданный новый проект
копируем содержимое, после этого сохраняем проект и перегружаем таблицу, после этого функции библиотеки доступны для использования.
  getROstatuses() - список статусов
  getROcashbox() - список касс
  getROtodayCash(dd, dd0) - движение денег по кассам за период
  getROwarehouses() - список складов
  getROlocations() - список локаций
  getROorders(dd,dd0) - закзаы за период
  getROsales(dd,dd0) - продажи за период
  getROleads(dd,dd0) - новые лиды за период
  getROClients(dd,dd0) - новые клиенты за период
  getROSaleProducts(dd,dd0) - товары проданные за период
  getROOrderProducts(dd,dd0) - товары, добавленные в заказ за период
  getROOrderOperations(dd,dd0) - услуги в заказах за пеиод
  
ROdataConnector.gs - небольшой тест коннектора к РемОнлайн для Goggle Data studio.
