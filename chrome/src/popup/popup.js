/**
 * 发送消息到扩展
 * @param {string} type
 * @param {any} value
 */
const sendToEx = function (type, value) {
  chrome.runtime.sendMessage({type, value})
}

/**
 * 发送消息到标签
 * @param {number} tabId
 * @param {string} type
 * @param {any} value
 */
const sendToTabs = function (tabId, type, value, option) {
  return chrome.tabs.sendMessage(tabId, {type, value}, option)
}

/**
 * 发送消息到标签的所有frame中
 * @param {number} tabId
 * @param {string} type
 * @param {any?} value
 * @param {{ok: (record: any)=>void, fail: (err: any)=>void}?} callbacks
 */
const sendToTabFrames = function (tabId, type, value, callbacks) {
  chrome.webNavigation.getAllFrames({tabId}).then((frames) => {
    for (let frame of frames) {
      let frameId = frame.frameId;
      const promise = sendToTabs(tabId, type, value, {frameId})
      if(callbacks?.ok)promise.then(callbacks.ok)
      if(callbacks?.fail)promise.catch(callbacks.fail)
    }
  })
}


/**
 * -----------------------------
 * ---------- storage ----------
 * -----------------------------
 */
const dataPromise = chrome.storage.local.get();
let data;

let isUpdateEnable = false;
let isUpdateCondif = false;
let isUpdateBasic = false;
let isUpdateSpecial = false;

let basicStore;
let basicStoreData = {};

const bindBasicStore = function () {
  basicStore = new Proxy(basicStoreData, {
    get(target, key) { return target[key] },
    set(target, key, value) {
      if (value.select == undefined || value.value == undefined) return;
      target[key] = value;
      isUpdateBasic = true;
      return true;
    }
  });
}

/**
 * ---------------------------
 * ---------- basic ----------
 * ---------------------------
 */

// radio change 事件
const evRadioChange = function (radios, self, key) {
  for (let radio of radios) {
    let tar = radio.nextElementSibling?.nextElementSibling;
    if (!tar) continue;
    if (radio == self) {
      tar.classList.remove('disable');
      tar.removeAttribute('disabled');
      let tName = tar.tagName?.toLowerCase();
      if(key != undefined){
        if(tName == 'select'){
          basicStore[key] = {select: 0, value: tar.value};
        }else if(tName == 'input'){
          basicStore[key] = {select: 1, value: tar.value};
        }
      }
    } else {
      tar.classList.add('disable');
      tar.setAttribute('disabled', '');
    }
  }
}

/**
 * 注册基础指纹配置
 * @param {string} pos_s posision selector
 * @param {string} temp_s template selector
 */
const regBasicItem = function (pos_s, temp_s) {
  let position = document.querySelector(pos_s);
  let template = document.querySelector(temp_s);
  if (!position || !template) return;

  // 节点
  let node = document.createDocumentFragment();
  let isFirst = true;
  for (let key in BasicData) {
    // is first
    if (isFirst) isFirst = false;
    else node.appendChild(document.createElement('hr'));

    let conf = BasicData[key];
    let local = basicStoreData[key];
    let n_select = local?.select ?? 0;
  
    // title
    let tmp = template.cloneNode(true);
    tmp.classList.remove('_temp');
    tmp.querySelector('.title').innerHTML = conf.title;
    // select
    let select = tmp.querySelector('select');
    for (let val of conf.options) {
      let option = document.createElement('option');
      option.setAttribute('value', val.k);
      option.innerHTML = val.v;
      select.appendChild(option);
    }
    if(local && n_select == 0)select.value = local.value;
    // diy input
    let input = tmp.querySelector('input.diy');
    if(conf.hint)input.placeholder = conf.hint;
    if(local && n_select == 1)input.value = local.value;
    // radio name and event
    let radios = tmp.querySelectorAll('input[type="radio"]');
    for (let i = 0; i < radios.length; ++i) {
      let radio = radios[i];
      radio.name = key;
      // event
      radio.addEventListener('change', () => evRadioChange(radios, radio, key))
      // init radio
      if (i == n_select) {
        radio.checked = true;
        evRadioChange(radios, radio);
      }
    }
    // other event
    select.addEventListener('change', () => {
      basicStore[key] = {select: 0, value: select.value}
    });
    input.addEventListener('blur', () => {
      basicStore[key] = {select: 1, value: input.value}
    });
    node.appendChild(tmp);
  }
  position.appendChild(node);
}

const BasicData = {}
const initBasicData = function () {
  for(let k in BasicConf){
    BasicData[BasicConf[k]] = {
      "title": k,
      "options":[
        SelectOpt.default, SelectOpt.page, SelectOpt.browser, SelectOpt.domain
      ]
    }
  }
}

/**
 * ------------------------
 * ---------- UI ----------
 * ------------------------
 */

// 注册下拉按钮
let prevDropDown;
const initDropDown = function (button, elem, firstClickCall) {
  let btn = document.querySelector(button);
  let el = document.querySelector(elem);
  if(!btn || !el)return;
  let first = true;
  btn.addEventListener('click', () => {
    if(first && firstClickCall){
      firstClickCall(btn, el);
      first = false;
    }
    if(el !== prevDropDown){
      prevDropDown?.classList.add('disable');
    }
    el.classList.toggle('disable');
    prevDropDown = el;
  });
}

/**
 * registration basic dropdown btn
 * @param {string} button: button selectors
 * @param {string} elem: enable elem selector
 */
const regBasicUI = function (button, elem) {
  initDropDown(button, elem, (btn, el) => {
    basicStoreData = data[Mode.basic];
    bindBasicStore();
    initBasicData();
    regBasicItem('#basic .drop-down div', '.basic._temp');
  })
}

// 注册config ui

const regConfigUI = function (button, elem) {
  initDropDown(button, elem, (btn, el) => {
    // regThreeSwitchBox('#config .basic.item', Control.basicRecord);
    // regThreeSwitchBox('#config .special.item', Control.specialRecord);
    regSwitchBox(el.querySelector('._navigator'), Control.navigator);
    regSwitchBox(el.querySelector('._screen'), Control.screen);
  })
}

const regSwitchBox = function (elem, configId) {
  let input = elem.querySelector('input');
  let text = elem.querySelector('.subtitle');
  input.addEventListener('change', () => changeSwitchBox(input, text, configId));
  changeSwitchBox(input, text, configId, true);
}

const changeSwitchBox = function (input, text, configId, first) {
  let checked;
  if(first){
    checked = data[Mode.config][configId];
    input.checked = checked;
  }else{
    checked = input.checked;
    data[Mode.config][configId] = checked;
    isUpdateCondif = true;
  }
  if(checked)text.textContent = '开启';
  else text.textContent = '关闭';
}

const regThreeSwitchBox = function (selector, type) {
  let item = document.querySelector(selector);
  let swbox = item?.querySelector('.switch');
  let text = item?.querySelector('.subtitle');
  if(!item || !swbox || !text)return;
  swbox.addEventListener('click', ()=>{changeThreeSwitchBox(swbox, text, type)});
  changeThreeSwitchBox(swbox, text, type, true);
}

const changeThreeSwitchBox = function (swbox, text, type, first) {
  let state;
  if(first){
    state = data[Mode.config][type];
    swbox.value = state;
  }else{
    state = swbox.value;
    if(state == undefined)state = 0;
    state += 1;
    if(state > 2)state = 0;
    swbox.value = state;
    data[Mode.config][type] = state;
    isUpdateCondif = true;
  }
  switch(state){
    case 0: {
      swbox.classList.remove('state2');
      text.textContent = '关闭'
      break;
    }
    case 1: {
      swbox.classList.add('state1');
      text.textContent = '开启'
      break;
    }
    case 2: {
      let cl = swbox.classList;
      if(cl.contains('state1'))cl.replace('state1', 'state2');
      else cl.add('state2')
      text.textContent = '开启'
      break;
    }
  }
}

const switchStartUI = function (checkbox, text, first) {
  let enable;
  if(first){
    enable = data[Mode.enable];
    checkbox.checked = enable;
  }
  else {
    enable = checkbox.checked;
    data[Mode.enable] = enable;
    isUpdateEnable = true;
  }
  if(enable){
    text.innerHTML = '已开启'
  }else{
    text.innerHTML = '已关闭'
  }
}

// 注册启动UI
const regStartUI = function (selector) {
  let box = document.querySelector(selector);
  let text = box.querySelector('span');
  let checkbox = box.querySelector('input');
  checkbox.addEventListener('change', ()=>{switchStartUI(checkbox, text)});
  switchStartUI(checkbox, text, true);
}

// 注册 Special UI
const regSpecialUI = function (button, elem) {
  initDropDown(button, elem, (btn, el) => {
    initSpecialSelect(el.querySelector('._canvas'), SpecialConf.canvas, [SelectOpt.default, SelectOpt.page, SelectOpt.browser, SelectOpt.domain]);
    initSpecialSelect(el.querySelector('._audio'), SpecialConf.audio, [SelectOpt.default, SelectOpt.page, SelectOpt.browser, SelectOpt.domain]);
    initSpecialSelect(el.querySelector('._webgl'), SpecialConf.webgl, [SelectOpt.default, SelectOpt.page, SelectOpt.browser, SelectOpt.domain]);
    initTimeZoneSelect(el.querySelector('._time'), SpecialConf.timezone);
    initSpecialSelect(el.querySelector('._webrtc'), SpecialConf.webrtc, [SelectOpt.default, SelectOpt.localhost, SelectOpt.proxy]);
  })
}

const initSpecialSelect = function (select, type, optArray) {
  if(!select)return;
  // add option
  let frag = document.createDocumentFragment();
  for(let opt of optArray){
    let option = document.createElement('option');
    option.value = opt.k;
    option.textContent = opt.v;
    frag.appendChild(option);
  }
  select.appendChild(frag)

  // init
  select.value = data[Mode.special][type];
  select.addEventListener('change', () => {
    data[Mode.special][type] = select.value;
    isUpdateSpecial = true;
  });
}

const initTimeZoneSelect = function (select, type) {
  if(!select)return;
  // add option
  let frag = document.createDocumentFragment();
  let option = document.createElement('option');
  option.value = -1;
  option.textContent = '系统值';
  frag.appendChild(option);

  for(let i in timeOpt){
    let tz = timeOpt[i];
    let option = document.createElement('option');
    option.value = i;
    option.textContent = tz.text;
    frag.appendChild(option);
  }
  select.appendChild(frag);

  // init
  select.value = data[Mode.special][type];
  select.addEventListener('change', () => {
    data[Mode.special][type] = select.value;
    isUpdateSpecial = true;
  });
}


// 注册 record ui
let recordItem;
const regRecordUI = function (button, elem) {
  initDropDown(button, elem, (btn, el) => {
    recordItem = document.querySelector('._temp.record.item');
    recordItem.classList.remove('_temp', 'record');
    regRecordItem(el.querySelector('.basic'), el.querySelector('.special'));
    bgInitActiveTabRecord();
  })
}

const regRecordItem = function (basicItem, specialItem) {
  if(!basicItem || !specialItem)return;
  addRecordItem(basicItem, BasicConf);
  addRecordItem(specialItem, SpecialConf);
}

const addRecordItem = function (item, conf) {
  let frag = document.createDocumentFragment();
  for(let key in conf){
    let id = conf[key];
    let item = recordItem.cloneNode(true);
    let spans = item.querySelectorAll('span');
    spans[0].textContent = key;
    spans[1].textContent = `× 0`;
    recordCountSpan[id] = spans[1];
    frag.appendChild(item);
  }
  item.appendChild(frag);
}

// 注册 about ui
const regAboutUI = function (button, elem) {
  initDropDown(button, elem, (btn, el) => {
    // get manifest
    let manifest = chrome.runtime.getManifest();

    // version
    let ver = manifest.version;
    el.querySelector('._version').textContent = ver;

    // is update
    let el_update = el.querySelector('._update');
    fetch('https://api.github.com/repos/omegaee/my-fingerprint/releases/latest', {
      method: 'GET',
    })
    .then(response => response.json())
    .then(data => {
      let latest = data.tag_name;
      if(latest == undefined){
        el_update.textContent = "检查更新失败"
      }else if(ver != latest){
        el_update.textContent = `最新版本：${latest}（点击更新）`
        el_update.href = data.html_url || '#'
      }else{
        el_update.textContent = "已是最新版本"
      }
    })
    .catch(error => {
      el_update.textContent = "检查更新失败"
    });
  })
}

/**
 * -----------------------------
 * ---------- message ----------
 * -----------------------------
 */
const recordCountSpan = {};
const allRecords = new Proxy({}, {
  set(target, key, value){
    target[key] = value;
    recordCountSpan[key].textContent = '× ' + value;
    return true;
  }
});
const bgInitActiveTabRecord = function () {
  // sum all record
  chrome.tabs.query({active: true, currentWindow: true}).then((tabs)=>{
    // let tabId = tabs[0].id;
    // // total all frame record
    // chrome.webNavigation.getAllFrames({tabId}).then((frames) => {
    //   for (let frame of frames) {
    //     let frameId = frame.frameId;
    //     chrome.tabs.sendMessage(tabId, {type: 'record'}, {frameId})
    //     .then((record) => {
    //       if(!record)return;
    //       sumRecord(record);
    //     })
    //     .catch(() => {
    //     })
    //   }
    // })
    sendToTabFrames(tabs[0].id, 'record', undefined, {
      ok: (record) => {
        if(!record)return;
        sumRecord(record);
      },
      fail: () => {}
    })
  })
}

/**
 * 累加
 * @param {*} record 
 */
const sumRecord = function (record) {
  for(let key in record){
    let sc = allRecords[key];
    let rc = record[key];
    if(sc == undefined)sc = rc;
    else sc += rc;
    allRecords[key] = sc;
  }
}

/**
 * --------------------------------------
 * ---------- DOMContentLoaded ----------
 * --------------------------------------
 */

window.addEventListener('DOMContentLoaded', async () => {
  sendToEx('re-ip')  // refresh public ip

  data = await dataPromise;
  // start
  regStartUI('.start');
  // config
  regConfigUI('#config ._btn', '#config .drop-down');
  // basic
  regBasicUI('#basic ._btn', '#basic .drop-down');
  // special
  regSpecialUI('#special ._btn', '#special .drop-down');
  // record
  regRecordUI('#record ._btn', '#record .drop-down');
  // about
  regAboutUI('#about ._btn', '#about .drop-down')
});

/**
 * ------------------------------
 * ---------- onunload ----------
 * ------------------------------
 */

// 失去焦点
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== "hidden") return;
  let __data = {};
  if(isUpdateEnable)__data[Mode.enable] = data[Mode.enable];
  if(isUpdateCondif)__data[Mode.config] = data[Mode.config];
  if(isUpdateBasic)__data[Mode.basic] = basicStoreData;
  if(isUpdateSpecial)__data[Mode.special] = data[Mode.special];
  if(Object.keys(__data).length > 0){
    chrome.storage.local.set(__data);
  }
})



