module.exports = class {
    constructor() {
        const chai = require("chai");
        const cap = require("chai-as-promised");
        chai.use(cap);
        chai.should();
        this.__data__ = {}
        this.__case__ = {}
    }

    register_check_item(name, fetcher, value) {
        this.__data__[name] = { f: fetcher }
        if (value !== undefined) {
            this.expect_value(name, value);
        }
    }

    set_expect(name, f) {
        CHECKER.__data__[name].expect = f;
    }

    expect_value(name, value) {
        this.set_expect(name, v => v.should.eventually.equal(value));
    }

    expect_rejected(name) {
        this.set_expect(name, v => v.should.be.rejected);
    }

    change_value(name, f) {
        CHECKER.expect_value(name, f(CHECKER.__data__[name].value))
    }

    async fetch() {
        for (const k in this.__data__) {
            await this.__data__[k].f().then(v => {
                this.__data__[k].val = v;
                this.expect_value(k, v);
            }).catch(err => { });
        }
    }
    async check() {
        for (const k in this.__data__) {
            try {
                await this.__data__[k].expect(this.__data__[k].f());
            } catch (err) {
                throw new Error(`${k}: ${err}`);
            }
        }
    }

    case(name, f) {
        [...name].forEach(v => {
            if (v < '/') {
                throw name;
            }
        })
        if (this.__case__[name]) {
            throw name;
        }
        this.__case__[name] = f
    }

    run() {
        Object.keys(this.__case__).sort().forEach(key => {
            this.test(key, this.__case__[key]);
        })
    }

    test(name, f) {
        it(name, async function () {
            const path = require('path')
            await network.provider.send("evm_revert", [snapshots[path.dirname(name)]]).should.eventually.equal(true);
            snapshots[path.dirname(name)] = await network.provider.send("evm_snapshot");
            await CHECKER.fetch();
            await f();
            await CHECKER.check();
            snapshots[name] = await network.provider.send("evm_snapshot");
        })
    }
}
