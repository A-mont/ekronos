"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sailsInstance = exports.gearKeyringByWalletData = exports.createGearApi = void 0;
const api_1 = require("@gear-js/api");
const sails_js_1 = require("sails-js");
const sails_js_parser_1 = require("sails-js-parser");
const createGearApi = async (network) => {
    try {
        const api = await api_1.GearApi.create({
            providerAddress: network
        });
        return api;
    }
    catch (error) {
        throw new Error(`Failed to create GearApi: ${error}`);
    }
};
exports.createGearApi = createGearApi;
const gearKeyringByWalletData = async (walletName, walletMnemonic) => {
    try {
        const signer = await api_1.GearKeyring.fromMnemonic(walletMnemonic, walletName);
        return signer;
    }
    catch (error) {
        throw new Error(`Failed to create signer: ${error}`);
    }
};
exports.gearKeyringByWalletData = gearKeyringByWalletData;
const sailsInstance = async (api, contractId, idl) => {
    try {
        const parser = await sails_js_parser_1.SailsIdlParser.new();
        const sails = new sails_js_1.Sails(parser);
        sails.setApi(api);
        sails.setProgramId(contractId);
        sails.parseIdl(idl);
        return sails;
    }
    catch (error) {
        throw new Error(`Failed to create Sails instance: ${error}`);
    }
};
exports.sailsInstance = sailsInstance;
//# sourceMappingURL=vara.utils.js.map