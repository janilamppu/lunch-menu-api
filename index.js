const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');

const LUNCHES_PER_WEEK = 5;
const MENU_URL = 'https://www.iskucenter.fi/m19-food-market/';
const STRINGS_TO_EXCLUDE = ["BUSINESS PARK:", "10,40 €", "8,50 €"];

getMenu();
//console.log(moment("ma 05.2").format("DD.MM.YYYY"));

async function getMenu() {
  const content = await axios.get(MENU_URL);
  $ = cheerio.load(content.data);
  var lunches = [];
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
    let lunch = {
      lunchDate: parseDate(date),
      vegetableLunch: lunchOptions[0],
      nonVegetableLunch: lunchOptions[1], 
    };
    lunches.push(lunch);
    if (a == LUNCHES_PER_WEEK-1) return false;
  });
  console.log(JSON.stringify(lunches));
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