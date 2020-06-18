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
 * The Common Click action. This adds the common click event items from an EDDL Other event.
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
          setVar(trackerVar, event.detail.page[key]);
        } else if (msg) {
          turbine.logger.error(msg);
        }
      }

      /**
       * Helper to set a tracker var based on the page key.
       * @param {string} trackerVar The key of the tracker object.
       * @param {string} value The value to set the tracker parameter to.
       */
      function setVar(trackerVar, value) {
        tracker[trackerVar] = value;
        tracker.linkTrackVars = pushToStringList(
          tracker.linkTrackVars,
          trackerVar
        );
      }

      /**
       * "Duplicates" prop to evar.
       * @param {string} evarNum The evar number to set.
       * @param {string} propNum The property number to set it to.
       */
      function copyEvarFromProp(evarNum, propNum) {
        var trackerVar = 'eVar' + evarNum;
        tracker[trackerVar] = 'D=c' + propNum;
        tracker.linkTrackVars = pushToStringList(
          tracker.linkTrackVars,
          trackerVar
        );
      }

      /**
       * "Duplicates" prop to evar.
       * @param {string} evarNum The evar number to set.
       * @param {string} otherKey The other trackerKey to set it to.
       */
      function copyEvarFromOtherKey(evarNum, otherKey) {
        tracker['eVar' + otherKey] = 'D=' + otherKey;
        tracker.linkTrackVars = pushToStringList(
          tracker.linkTrackVars,
          otherKey
        );
      }

      /**
       * Adds an event to the tracker.
       * @param {string} evt The event to add
       */
      function addEvent(evt) {
        tracker.events = pushToStringList(tracker.events, evt);
        if (
          !tracker.linkTrackVars ||
          tracker.linkTrackVars.indexOf('events') === -1
        ) {
          tracker.linkTrackVars = pushToStringList(
            tracker.linkTrackVars,
            'events'
          );
        }
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
        'Event Details did not contain channel'
      );
      setVarOrError(
        'language',
        'prop8',
        'Event Details did not contain language'
      );

      setVar('prop4', 'D=pev1');

      copyEvarFromProp('2', '8');
    });
  }
};
