import categories = require('../categories');
import events = require('../events');
import user = require('../user');
import groups = require('../groups');
import privileges = require('../privileges');

const categoriesAPI = module.exports;

type Caller = {
    uid: number
    ip: string | number | null
}

type Data1 = {
    cid: number
}

type Data2 = {
    parentCid?: number;
    name?: string;
    order?: number;
}

type PrivilegeData = { member: string; privilege: string | string[]; set: boolean; cid: string; }

type GetReturnType = { cid: number }

type UserPrivileges = {read: string}

type Response = {cid: number}


categoriesAPI.get = async function (caller : Caller, data : Data1): Promise<GetReturnType> {
    const [userPrivileges, category] = await Promise.all([
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        privileges.categories.get(data.cid, caller.uid),
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        categories.getCategoryData(data.cid),
    ]) as [UserPrivileges, GetReturnType];
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!category || !userPrivileges.read) {
        return null;
    }

    return category;
};

categoriesAPI.create = async function (caller : Caller, data: Data2) : Promise<GetReturnType> {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const response = await categories.create(data) as Response;
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const categoryObjs = await categories.getCategories([response.cid], caller.uid) as GetReturnType;
    return categoryObjs[0];
};

categoriesAPI.update = async function (caller: Caller, data: Data1): Promise<void> {
    if (!data) {
        throw new Error('[[error:invalid-data]]');
    }
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await categories.update(data);
};

categoriesAPI.delete = async function (caller: Caller, data : Data1): Promise<void> {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const name = await categories.getCategoryField(data.cid, 'name') as string;
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await categories.purge(data.cid, caller.uid);
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    await events.log({
        type: 'category-purge',
        uid: caller.uid,
        ip: caller.ip,
        cid: data.cid,
        name: name,
    });
};

categoriesAPI.getPrivileges = async (caller: Caller, cid: string) => {
    let responsePayload;

    if (cid === 'admin') {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        responsePayload = await privileges.admin.list(caller.uid);
    } else if (!parseInt(cid, 10)) {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        responsePayload = await privileges.global.list();
    } else {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        responsePayload = await privileges.categories.list(cid);
    }

    return responsePayload;
};

categoriesAPI.setPrivilege = async (caller: Caller, data: PrivilegeData): Promise<void> => {
    const [userExists, groupExists] = await Promise.all([
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        user.exists(data.member),
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        groups.exists(data.member),
    ]) as [string, string];

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
        const adminPrivList = await privileges.admin.getPrivilegeList() as string;
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const adminPrivs = privs.filter(priv => adminPrivList.includes(priv));
        if (adminPrivs.length) {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            await privileges.admin[type](adminPrivs, data.member);
        }
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const globalPrivList = await privileges.global.getPrivilegeList() as string;
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const globalPrivs = privs.filter(priv => globalPrivList.includes(priv));
        if (globalPrivs.length) {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            await privileges.global[type](globalPrivs, data.member);
        }
    } else {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const categoryPrivList = await privileges.categories.getPrivilegeList() as string;
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const categoryPrivs = privs.filter(priv => categoryPrivList.includes(priv));
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        await privileges.categories[type](categoryPrivs, data.cid, data.member);
    }

    await events.log({
        uid: caller.uid,
        type: 'privilege-change',
        ip: caller.ip,
        privilege: data.privilege.toString(),
        cid: data.cid,
        action: data.set ? 'grant' : 'rescind',
        target: data.member,
    });
};
