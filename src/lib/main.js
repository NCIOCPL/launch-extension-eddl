const objectAssign = require('@adobe/reactor-object-assign');
const window = require('@adobe/reactor-window');

// We will name our Event-driven Data Layer (EDDL) 
// NCIDataLayer to ensure that it does not conflict
// with any future changes.
_satellite.logger.debug("Begin EDDL Initialization");

// We need to keep ahold of context from when certain events
// occur. For example, if we have a page load event, we should
// keep track of the data for the page so subsequent click
// events know the page they are on. This can then be added
// into the event data.
let context = {};

/**
 * Resets the current context. Currently only does it on
 * page load.
 * @param {object} ctx the full context object
 */
const resetContext = function(ctx) {
  context = ctx;
}

/**
 * Smushes context + individual event data
 * @param {object} evtObj The raw event object
 */
const mergeContextAndData = function(evtObj) {
  var data = objectAssign({}, evtObj.data);
  var page = objectAssign({}, context.page);
  return {
    page: page,
    data: data,
  };
}

/**
 * Function that dispatches the analytics events.
 * 
 * This is what performs the satellite track event.
 * @param {string} evtName The name of the event
 * @param {object} evtObj The raw event object
 */
const analyticsDispatcher = function(evtName, evtObj) {  
  var evtData = mergeContextAndData(evtObj);
  _satellite.logger.debug(evtData);
  _satellite.track(evtName, evtData);
};

/**
 * Pushes a page load event.
 *
 * @param {string} evtName The name of the event
 * @param {object} evtObj The raw object pushed into the data layer.
 */
const pushPageLoad = function (evtName, evtObj) {
  // Strip off the page object and store it in the context.
  var pageData = evtObj.page;
  if (!pageData) {
    _satellite.logger.error("NCIDataLayer: There is no page information for event " + evtName);
    return;
  }

  // Reset and replace the context.
  resetContext({
    page: pageData
  })

  _satellite.logger.debug("NCIDataLayer: Dispatching Page Load Event " + evtName);
  analyticsDispatcher(evtName, evtObj);
};

/**
 * Pushes an "other" event.
 *
 * @param {*} evtName The name of the event
 * @param {*} evtObj The raw object pushed into the data layer.
 */
const pushOther = function (evtName, evtObj) {
  _satellite.logger.debug("NCIDataLayer: Dispatching Other Event " + evtName);
  analyticsDispatcher(evtName, evtObj);
}

// This is the replacement fn for window.NCIDataLayer.push,
// which will dispatch the events. NOTE: the signature for
// push is arr.push(element1[, ...[, elementN]]) meaning
// that push can be called with multipe elements.
const pusher = function() {
  // Get all the arguments, as push takes in n number of arguments.
  for (let i=0; i < arguments.length; i++) {
    let evtType = arguments[i].type;
    let evtName = arguments[i].event;
    
    if (!evtType) {
      _satellite.logger.error("NCIDataLayer: 'type' is missing from Event object");
      continue;
    }
    if (!evtName) {
      _satellite.logger.error("NCIDataLayer: 'event' is missing from Event object");
      continue;
    }
    
    if (evtType === 'PageLoad') {
      pushPageLoad(evtName, arguments[i]);
    } else if (evtType === 'Other') {
      pushOther(evtName, arguments[i]);
    } else {
      _satellite.logger.error("NCIDataLayer: unknown event type " + evtType);
    }
  }
}

// This initializes the datalayer to an empty array, or
// keeps it as it is.
window.NCIDataLayer = window.NCIDataLayer || [];

// Set our pusher if it is not already set
// this should avoid accidental re-initializations
if (window.NCIDataLayer.push !== pusher) {
  // Process all the existing items until the queue is
  // empty.
  let existingItem;
  while ((existingItem = window.NCIDataLayer.shift()) !== undefined) {
    analyticsDispatcher(existingItem.type, existingItem.data);
  }
  // Replace the default push function with ours.
  window.NCIDataLayer.push = pusher;
}

_satellite.logger.debug("Completed EDDL Initialization");
