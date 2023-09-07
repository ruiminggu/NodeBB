"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const categories = require("../categories");
const events = require("../events");
const user = require("../user");
const groups = require("../groups");
const privileges = require("../privileges");
const categoriesAPI = module.exports;
categoriesAPI.get = function (caller, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const [userPrivileges, category] = yield Promise.all([
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            privileges.categories.get(data.cid, caller.uid),
            categories.getCategoryData(data.cid),
        ]);
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (!category || !userPrivileges.read) {
            return null;
        }
        return category;
    });
};
categoriesAPI.create = function (caller, data) {
    return __awaiter(this, void 0, void 0, function* () {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const response = yield categories.create(data);
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const categoryObjs = yield categories.getCategories([response.cid], caller.uid);
        return categoryObjs[0];
    });
};
categoriesAPI.update = function (caller, data) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!data) {
            throw new Error('[[error:invalid-data]]');
        }
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        yield categories.update(data);
    });
};
categoriesAPI.delete = function (caller, data) {
    return __awaiter(this, void 0, void 0, function* () {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const name = yield categories.getCategoryField(data.cid, 'name');
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        yield categories.purge(data.cid, caller.uid);
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        yield events.log({
            type: 'category-purge',
            uid: caller.uid,
            ip: caller.ip,
            cid: data.cid,
            name: name,
        });
    });
};
categoriesAPI.getPrivileges = (caller, cid) => __awaiter(void 0, void 0, void 0, function* () {
    let responsePayload;
    if (cid === 'admin') {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        responsePayload = yield privileges.admin.list(caller.uid);
    }
    else if (!parseInt(cid, 10)) {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        responsePayload = yield privileges.global.list();
    }
    else {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        responsePayload = yield privileges.categories.list(cid);
    }
    return responsePayload;
});
categoriesAPI.setPrivilege = (caller, data) => __awaiter(void 0, void 0, void 0, function* () {
    const [userExists, groupExists] = yield Promise.all([
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        user.exists(data.member),
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        groups.exists(data.member),
    ]);
    if (!userExists && !groupExists) {
        throw new Error('[[error:no-user-or-group]]');
    }
    const privs = Array.isArray(data.privilege) ? data.privilege : [data.privilege];
    const type = data.set ? 'give' : 'rescind';
    if (!privs.length) {
        throw new Error('[[error:invalid-data]]');
    }
    if (parseInt(data.cid, 10) === 0) {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const adminPrivList = yield privileges.admin.getPrivilegeList();
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const adminPrivs = privs.filter(priv => adminPrivList.includes(priv));
        if (adminPrivs.length) {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            yield privileges.admin[type](adminPrivs, data.member);
        }
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const globalPrivList = yield privileges.global.getPrivilegeList();
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const globalPrivs = privs.filter(priv => globalPrivList.includes(priv));
        if (globalPrivs.length) {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            yield privileges.global[type](globalPrivs, data.member);
        }
    }
    else {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const categoryPrivList = yield privileges.categories.getPrivilegeList();
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const categoryPrivs = privs.filter(priv => categoryPrivList.includes(priv));
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        yield privileges.categories[type](categoryPrivs, data.cid, data.member);
    }
    yield events.log({
        uid: caller.uid,
        type: 'privilege-change',
        ip: caller.ip,
        privilege: data.privilege.toString(),
        cid: data.cid,
        action: data.set ? 'grant' : 'rescind',
        target: data.member,
    });
});
