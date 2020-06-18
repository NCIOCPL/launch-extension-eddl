'use strict';

var getTracker = turbine.getSharedModule('adobe-analytics', 'get-tracker');

/**
 * Helper to push an item onto a comma-separated string list
 * @param {string} stringList the string list
 * @param {string} item the item to push
 */
function pushToStringList(stringList, item) {
  var newString = stringList;
  if (!newString) {
    newString = '';
  }

  return newString + (newString.length > 0 ? ',' + item : item);
}

/**
 * The custom code action. This loads and executes custom JavaScript or HTML provided by the user.
 * @param {Object} settings Action settings. This will have none for now.
 * @param {Object} event The underlying event object that triggered the rule.
 * @param {Object} event.element The element that the rule was targeting.
 * @param {Object} event.detail The event details
 * @param {Object} event.target The element on which the event occurred.
 * <code>javascript</code> or <code>html</code>.
 */
module.exports = function (settings, event) {
  if (getTracker) {
    getTracker().then(function (tracker) {
      /**
       * Helper to set a tracker var based on the page key.
       * @param {string} key The key of page object.
       * @param {string} trackerVar The key of the tracker object.
       * @param {string} msg The error message to display
       */
      function setVarOrError(key, trackerVar, msg) {
        if (event.detail.page[key]) {
          tracker[trackerVar] = event.detail.page[key];
        } else if (msg) {
          turbine.logger.error(msg);
        }
      }

      /**
       * "Duplicates" prop to evar.
       * @param {string} evarNum The evar number to set.
       * @param {string} propNum The property number to set it to.
       */
      function copyEvarFromProp(evarNum, propNum) {
        tracker['eVar' + evarNum] = 'D=c' + propNum;
      }

      /**
       * "Duplicates" "otherKey" (e.g. pageName) to evar.
       * @param {string} evarNum The evar number to set.
       * @param {string} otherKey The other trackerKey to set it to.
       */
      function copyEvarFromOtherKey(evarNum, otherKey) {
        tracker['eVar' + evarNum] = 'D=' + otherKey;
      }

      /**
       * Adds an event to the tracker.
       * @param {string} evt The event to add
       */
      function addEvent(evt) {
        tracker.events = pushToStringList(tracker.events, evt);
      }

      // Initialize events because of other bad code that should be fixed.
      if (!tracker.events) {
        tracker.events = '';
      }

      // Can't continue without page object.
      turbine.logger.log('Adding Common load variables');
      if (!event.detail.page) {
        turbine.logger.error('Page information not found on Event Details');
        return;
      }

      setVarOrError(
        'name',
        'pageName',
        'Event Details did not contain page name'
      );
      setVarOrError(
        'channel',
        'channel',
        'Event Details did not contain page name'
      );
      setVarOrError(
        'audience',
        'prop7',
        'Event Details did not contain audience'
      );
      setVarOrError(
        'language',
        'prop8',
        'Event Details did not contain language'
      );
      setVarOrError(
        'metaTitle',
        'prop10',
        'Event Details did not contain metaTitle'
      );
      setVarOrError(
        'publishedDate',
        'prop25',
        'Event Details did not contain publishedDate'
      );
      setVarOrError(
        'contentGroup',
        'prop44',
        'Event Details did not contain contentGroup'
      );

      copyEvarFromProp('2', '8');
      copyEvarFromProp('7', '7');
      copyEvarFromProp('44', '44');

      addEvent('event1');
    });
  }
};
