const fs = require('fs')
const path = require('path')
const dbPath = path.join(__dirname, '/karpdb')

if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath)
}

class SimpleDB {
    constructor(name, struct) {
        this.name = name
        this.path = path.join(dbPath, name)
        this.tables = [];
        this.data = [];
        this.tableIndexes = {};

        if(fs.existsSync(path.join(dbPath, name)))
        {
            for(let tablename in struct)
            {
                let idx = this.tables.push({
                    name: tablename,
                    struct: struct[tablename]
                })

                idx--
                this.tableIndexes[tablename] = idx
                if(fs.existsSync(path.join(this.path, `${tablename}.json`)))
                {
                    this.data[idx] = JSON.parse(fs.readFileSync(path.join(this.path, `${tablename}.json`)))

                    for(let i = 0; i < this.data[idx].length; i++)
                    {
                        const row = this.data[idx][i]
                        for(let key in row)
                        {
                            let foundInStruct = false
                            for(let k in struct[tablename]) { 
                                if(key == k) { 
                                    foundInStruct = true
                                    break
                                }
                            }

                            if(!foundInStruct)
                            {
                                delete this.data[idx][i][key]
                            }
                        }

                        for(let key in struct[tablename])
                        {
                            let foundInData = false
                            for(let k in row)
                            {
                                if(k == key) 
                                {
                                    foundInData = true
                                    break
                                }
                            }

                            if(!foundInData)
                            {
                                this.data[idx][i][key] = struct[tablename][key]
                            }
                        }
                    }
                    setTimeout(() => this.writeTable(tablename), 1000)
                }
                else
                {
                    this.data[idx] = []
                }
            }
        }
        else
        {
           fs.mkdirSync(this.path)
        }
    }

    writeTable(tablename) {
        let tableidx = this.tableIndexes[tablename]
        if(tableidx == undefined) return 0

        if(fs.existsSync(path.join(this.path, tablename+'.json')))
        {
            fs.unlink(path.join(this.path, tablename+'.json'), () => {
                fs.writeFile(path.join(this.path, tablename+'.json'), JSON.stringify(this.data[tableidx]), {encoding:'utf8',flag:'w'}, () => {})
            })
        }
        else
        {
            fs.writeFile(path.join(this.path, tablename+'.json'), JSON.stringify(this.data[tableidx]), {encoding:'utf8',flag:'w'}, () => {})
        }
    }

    getRow(tablename, idx) {
        let tableidx = this.tableIndexes[tablename]
        return this.data[tableidx][idx]
    }
    
    setTableStruct(tablename, object)
    {
        let tableidx = this.tableIndexes[tablename]
        if(tableidx == undefined) return 0

        this.tables[tableidx] = {
            name: tablename,
            struct: object
        }

        fs.unlink(path.join(this.path, `${tablename}_struct.kjson`), () => {
            fs.writeFile(path.join(this.path, `${tablename}_struct.kjson`), JSON.stringify(this.tables[tableidx]), {encoding:'utf8',flag:'w'}, () => {})
        })

        return true
    }

    dropTable(tablename) {
        let tableidx = this.tableIndexes[tablename]
        if(tableidx == undefined) return 0

        this.data[tableidx] = []
        this.tableIndexes[tablename] = -1
        fs.unlink(path.join(this.path, tablename+'.json'))
        fs.unlink(path.join(this.path, tablename+'_struct.kjson'))
    }

    delete(tablename, func) {
        let tableidx = this.tableIndexes[tablename]
        if(tableidx == undefined) return 0

        let objectsToDelete = []
        let JSONArray = []

        for(let i = 0; i < this.data[tableidx].length; i++) {
            const instance = this.data[tableidx][i]
            if(func(instance) === true) 
            {
                JSONArray[i] = JSON.stringify(this.data[tableidx][i])
                objectsToDelete.push(JSONArray[i])
            }
        }

        objectsToDelete.forEach(item => {
            this.data[tableidx].splice(JSONArray.indexOf(item), 1)
        })

        this.writeTable(tablename)
        return true
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

        for(let key in this.tables[tableidx].struct)
        {
            if(this.tables[tableidx].struct[key] == 'AUTO_INCREMENT')
            {
                this.data[tableidx][rowidx-1][key] = rowidx
            }
        }

        this.writeTable(tablename)
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

    selectAll(tablename, fields) {
        let tableidx = this.tableIndexes[tablename]
        if(tableidx == undefined) return 0

        let result = []

        for(let instance of this.data[tableidx]) {
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

        this.writeTable(tablename)
        return true       
    }
}

module.exports = {
    SimpleDB
}
