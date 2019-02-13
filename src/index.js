const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');
const config = require('./config');

const LUNCHES_PER_WEEK = config.LUNCHES_PER_WEEK;
const MENU_URL = config.MENU_URL;
const STRINGS_TO_EXCLUDE = config.STRINGS_TO_EXCLUDE;

exports.getmenu = async function (event, context, callback) {
  const weekday = event.queryStringParameters.text || getCurrentWeekday();
  if (!validateWeekday(weekday)) {
    const response = {
      statusCode: 200,
      body: config.NO_LUNCH_FOR_WEEKDAY_TEXT
    };
    callback(null, response);   
    return; 
  }

  const lunchMenu = await getLunchMenu();
  const response = {
    statusCode: 200,
    body: createFormattedLunchMenu(lunchMenu[weekday], weekday)
  };
  callback(null, response);
}

async function getLunchMenu() {
  const content = await axios.get(MENU_URL);
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
    if (a == LUNCHES_PER_WEEK-1) return false;
  });
  return lunches;
}

function createFormattedLunchMenu(lunch, weekday) {
  return '```' + weekday + ' ' + lunch.lunchDate + '\r\n• ' + lunch.nonVegetableLunch + '\r\n• ' + lunch.vegetableLunch + '```';
}

function validateWeekday(day) {
  if (day && config.VALID_WEEKDAYS.indexOf(day) == -1) return false;
  return true;
}

function getCurrentWeekday() {
  return config.WEEKDAYS[moment().format('dddd')];
}

function removeUnwantedStringsFromMenu(menu) {
  for (let item of STRINGS_TO_EXCLUDE) {
    console.log(item);
    menu = menu.replace(item, "");
  }
  return menu;
}

function parseDate(date) {
  date = date.substring(3, date.length);
  if (date.indexOf('0') == 0) date = date.substring(1, date.length);
  return date;
}