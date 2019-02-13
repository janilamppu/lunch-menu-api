const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');
const config = require('./config');

exports.getmenu = async function (event, context, callback) {
  if (!validateRequest(event)) {
    console.log('Request failed at validation!');
    return returnResponse(callback, 403, config.INVALID_REQUEST_MESSAGE);
  }
  const weekday = event.queryStringParameters.text || getCurrentWeekday();
  console.log(`Slack user ${event.queryStringParameters.user_name} is requesting lunch menu (${weekday})`);
  if (!validateWeekday(weekday)) {
    return returnResponse(callback, 200, config.NO_LUNCH_FOR_WEEKDAY_TEXT);
  }
  const lunchMenu = await getLunchMenu();
  returnResponse(callback, 200, createFormattedLunchMenu(lunchMenu[weekday], weekday));
}

function validateRequest(event) {
  console.log(JSON.stringify(event));
  if (!event.queryStringParameters) return false;
  return true;
}

function returnResponse(callback, statuscode, body) {
  return callback(null, {
    statusCode: statuscode,
    body: body,
  });
}

function getCurrentWeekday() {
  return config.WEEKDAYS[moment().format('dddd')];
}

function validateWeekday(day) {
  if (day && config.VALID_WEEKDAYS.indexOf(day) == -1) return false;
  return true;
}

async function getLunchMenu() {
  const content = await axios.get(config.MENU_URL);
  $ = cheerio.load(content.data);
  let lunches = {};
  $('.lunch-menu > .row').each(function(a, elem) {
    let date = $(this).children('.date').text().trim();
    let lunchContent = removeUnwantedStringsFromMenu($(this)
      .children()
      .children('.panel-group')
      .children('.panel-default')
      .children('.no-description')
      .children('.meal')
      .text());
    const lunchOptions = lunchContent.trim().split(/\s{3}/);
    const lunchWeekday = date.substring(0, 2).toLowerCase();
    lunches[lunchWeekday] = {
      lunchDate: parseDate(date),
      vegetableLunch: lunchOptions[0],
      nonVegetableLunch: lunchOptions[1],       
    }
    if (a == config.LUNCHES_PER_WEEK-1) return false;
  });
  return lunches;
}

function createFormattedLunchMenu(lunch, weekday) {
  return '```' + weekday + ' ' + lunch.lunchDate + '\r\n• ' + lunch.nonVegetableLunch + '\r\n• ' + lunch.vegetableLunch + '```';
}

function removeUnwantedStringsFromMenu(menu) {
  for (let item of config.STRINGS_TO_EXCLUDE) {
    menu = menu.replace(item, "");
  }
  return menu;
}

function parseDate(date) {
  date = date.substring(3, date.length);
  if (date.indexOf('0') == 0) date = date.substring(1, date.length);
  return date;
}