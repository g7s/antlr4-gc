/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

goog.module('org.antlr.v4.runtime.atn.ATNDeserializationOptions');
goog.module.declareLegacyNamespace();

/**
 *
 * @author Sam Harwell
 */
class ATNDeserializationOptions {
    /**
     * @param {ATNDeserializationOptions=} options
     */
    constructor(options) {
        /**
         * @private {boolean}
         */
        this.readOnly = false;
        /**
         * @private {boolean}
         */
        this.verifyATN = goog.isDef(options) ? options.verifyATN : true;
        /**
         * @private {boolean}
         */
        this.generateRuleBypassTransitions = goog.isDef(options) ? options.generateRuleBypassTransitions : false;
    }

    /**
     * @return {boolean}
     */
    isReadOnly() {
        return this.readOnly;
    }

    /**
     * @return {void}
     */
    makeReadOnly() {
        this.readOnly = true;
    }

    /**
     * @return {boolean}
     */
    isVerifyATN() {
        return this.verifyATN;
    }

    /**
     * @param {boolean} verifyATN
     * @return {void}
     */
    setVerifyATN(verifyATN) {
        this.throwIfReadOnly();
        this.verifyATN = verifyATN;
    }

    /**
     * @return {boolean}
     */
    isGenerateRuleBypassTransitions() {
        return this.generateRuleBypassTransitions;
    }

    /**
     * @param {boolean} generateRuleBypassTransitions
     * @return {void}
     */
    setGenerateRuleBypassTransitions(generateRuleBypassTransitions) {
        this.throwIfReadOnly();
        this.generateRuleBypassTransitions = generateRuleBypassTransitions;
    }

    /**
     * @protected
     * @return {void}
     */
    throwIfReadOnly() {
        if (this.isReadOnly()) {
            throw new Error("The object is read only.");
        }
    }
}


/**
 * @private {ATNDeserializationOptions}
 */
ATNDeserializationOptions.defaultOptions = new ATNDeserializationOptions();
ATNDeserializationOptions.defaultOptions.makeReadOnly();

/**
 * @return {ATNDeserializationOptions}
 */
ATNDeserializationOptions.getDefaultOptions = function () {
    return ATNDeserializationOptions.defaultOptions;
};


exports = ATNDeserializationOptions;
