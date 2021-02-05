const fs = require('fs')
const path = require('path')
const dbPath = path.join(__dirname, '/karpdb')

if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath)
}

class SimpleDB {
    constructor(name) {
        this.name = name
        this.path = path.join(dbPath, name)
        this.tables = [];
        this.data = [];
        this.tableIndexes = {};

        if(fs.existsSync(path.join(dbPath, name)))
        {
            const tables = fs.readdirSync(this.path)

            for(let table of tables) {
                if(path.extname(table) == '.json') {
                    const tableName = path.basename(table, '.json')

                    let tableObject = JSON.parse(fs.readFileSync(path.join(this.path, `${tableName}_struct.kjson`)))

                    let idx = this.tables.push(tableObject)
                    idx --
                    this.tableIndexes[tableName] = idx
                    this.data[idx] = JSON.parse(fs.readFileSync(path.join(this.path, table)))
                }
            }
        }
        else
        {
            fs.mkdirSync(this.path)
        }
    }

    getRow(tablename, idx) {
        let tableidx = this.tableIndexes[tablename]
        return this.data[tableidx][idx]
    }

    createTable(tablename, object) {
        for(let table of this.tables)
        {
            if(table.name == tablename) return 0
        }
        let tableidx = this.tables.push({
            name: tablename,
            struct: object
        })

        fs.unlink(path.join(this.path, `${tablename}_struct.kjson`), () => {
            fs.writeFile(path.join(this.path, `${tablename}_struct.kjson`), JSON.stringify(this.tables[tableidx-1]), {encoding:'utf8',flag:'w'}, () => {})
        })

        this.data[tableidx-1] = []
        this.tableIndexes[tablename] = tableidx-1
        return tableidx-1
    }

    insert(tablename, object) {
        let tableidx = this.tableIndexes[tablename]

        if(tableidx == undefined) return 0

        let objectToPush = {};

        for(let givenKey in object) {
            let givenValue = object[givenKey]
            let validKey = false
            for(let key in this.tables[tableidx].struct)
            {
                let value = this.tables[tableidx].struct[key]
                if(key == givenKey)
                {
                    validKey = true
                    break
                }
            }
            if(validKey)
            {
                objectToPush[givenKey] = givenValue
            }
        }

        for(let key in this.tables[tableidx].struct)
        {
            let foundKey = false
            for(let givenKey in object) {
                if(key == givenKey)
                {
                    foundKey = true
                    break
                }
            }
            if(!foundKey) objectToPush[key] = this.tables[tableidx].struct[key]
        }

        let rowidx = this.data[tableidx].push(objectToPush)
        fs.unlink(path.join(this.path, tablename+'.json'), () => {
            fs.writeFile(path.join(this.path, tablename+'.json'), JSON.stringify(this.data[tableidx]), {encoding:'utf8',flag:'w'}, () => {})
        })
        return rowidx
    }

    find(tablename, func) {
        let tableidx = this.tableIndexes[tablename]

        if(tableidx == undefined) return 0

        let result = []

        for(let instance of this.data[tableidx]) {
            if(func(instance) === true) result.push(instance)
        }

        return result
    }

    select(tablename, fields, func) {
        let tableidx = this.tableIndexes[tablename]
        if(tableidx == undefined) return 0

        let result = []

        for(let instance of this.data[tableidx]) {
            if(func(instance) === true) 
            {
                let newInstance = {}

                for(let key in instance)
                {
                    if(fields.indexOf(key) != -1)
                    {
                        newInstance[key] = instance[key]
                    }
                }

                result.push(newInstance)
            }
        }

        return result       
    }

    update(tablename, object, func) {
        let tableidx = this.tableIndexes[tablename]
        if(tableidx == undefined) return 0

        for(let i = 0; i < this.data[tableidx].length; i++) {
            let instance = this.data[tableidx][i]

            if(func(instance) === true)
            {
                for(let key in object)
                {
                    this.data[tableidx][i][key] = object[key]
                }
            }
        }

        fs.unlink(path.join(this.path, tablename+'.json'), () => {
            fs.writeFile(path.join(this.path, tablename+'.json'), JSON.stringify(this.data[tableidx]), {encoding:'utf8',flag:'w'}, () => {})
        })
        return true       
    }
}

module.exports = {
    SimpleDB
}