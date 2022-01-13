const express = require('express')
const fs = require('fs')
const cors = require('cors')
const path = require('path')
const app = express()
app.use(cors())
app.use(express.json())
app.set('view engine', 'hbs')
app.use(express.urlencoded({ extended: true }))
const PORT = 4321
app.use(express.static(path.join(__dirname, '/public')))

const loadData =  () => {
    try {
        const data = fs.readFileSync('clients.json').toString()
        return  JSON.parse(data) 
    } catch(e) {
        return []
    }
}

const saveData = (arr) => {
    fs.writeFileSync('clients.json', JSON.stringify(arr))
}

const getClient = id => {
    const clients = loadData()
    return clients.find(client => client.passportId === id)
}

const updateClient = (id, updateType,amount = 0) => {
    const clients = loadData()
    const client = clients.find(aClient => aClient.passportId === id)
    if (updateType === 'withdraw'){        
        if (client.cash-amount >= -client.credit){
            client.cash -= +amount
        } 
        else return false
    }
    if (updateType === 'deposit'){
        client.cash += +amount
    }
    if (updateType === 'credit'){
        client.credit = +amount
    }
    saveData(clients)
    return true
}

// show users
app.get('/api', (req,res) => {
    const clients = loadData()
    res.render('homepage',{title:'Shmeckle Bank', clients: clients})
})
// add user
app.get('/api/add', (req,res) => {
    res.render('add', {title:'Shmeckle Bank'})
})

app.post('/api/add', (req,res) => {
    const {fullname,isActive, id, cash , credit } = req.body
    const clients = loadData()
    const isExist = getClient(id)
    if (isExist) return res.status(400).render('add', {title:'Shmeckle Bank' ,message:'client already exist'})
    const newClient = {
        passportId : id,
        fullName: fullname,
        cash: +cash || 0,
        credit: +credit || 0,
        isActive: isActive ? true: false
    }
    clients.push(newClient)
    saveData(clients)
    res.status(201).render('add',{title:'Shmeckle Bank' ,message: 'added succesfully!'})
})
// transfer cash from user to user
app.get('/api/transfer', (req,res) => {
    res.render('transfer')
})
app.post('/api/transfer', (req,res) => {
    const { fromId, toId, amount } = req.body
    const client1Exist = getClient(fromId)
    const client2Exist = getClient(toId)
    if (!client1Exist) return res.status(400).render('transfer', {title:'Shmeckle Bank', message: 'the client you want to withdraw shmeckles from doesnt exist'})
    if (!client2Exist) return res.status(400).render('transfer', {title:'Shmeckle Bank', message: 'the client you want to deposit shmeckles to doesnt exist'})
    if (!client1Exist.isActive) return res.status(400).render('transfer', {title:'Shmeckle Bank', message: 'the client you want to withdraw shmeckles from is not Active'})
    if (!client2Exist.isActive) return res.status(400).render('transfer', {title:'Shmeckle Bank', message: 'the client you want to deposit shmeckles to is not Active'})
    const isWithdrawn = updateClient(fromId,'withdraw', amount)
    if (!isWithdrawn) res.status(400).res.status(400).render('transfer', {title:'Shmeckle Bank', message: 'the client reached his credit limit'})
    else {
       const isUpdate =  updateClient(toId,'deposit', amount)
       if (isUpdate) res.render('transfer',{title:'Shmeckle Bank', message: `client with id ${fromId} transferred ${amount} shmeckles to the client with id ${toId}`}) 
        else res.status(400).render('transfer', {title:'Shmeckle Bank', message:'something went wrong with the transfer'})
    }
})

// filter clients by category

app.get('/api/filter', (req,res) => {
    res.render('filter', {title:'Shmeckle Bank', results: []})
})

app.post('/api/filter', (req,res) => {
    const {category, moreThan, lessThan} = req.body
    const clients = loadData()
    let filteredResult 
    if (category === 'active') filteredResult = clients.filter(client => client.isActive)
    if (category === 'rich') filteredResult = clients.filter(client => client.cash >= moreThan)
    if (category === 'poor') filteredResult = clients.filter(client => client.cash <= lessThan)
    res.render('filter', {title:'Shmeckle Bank', results: filteredResult})
})

// show client by id
app.get('/api/:id',(req,res) => {
    const { id } = req.params
    const chosenClient = getClient(id)
    if (chosenClient) res.render('details',{client:chosenClient})
    else res.status(400).send('client doesnt exist')
})

//withdraw from user
app.get('/api/:id/withdraw', (req,res) => {
    const { id } = req.params
    const isExist = getClient(id)
    if (!isExist) return res.status(400).render('client-actions',{title:'Shmeckle Bank',actions:'withdraw',message:'client doesnt exist'})
    if (!isExist.isActive) return res.status(400).render('client-actions',{title:'Shmeckle Bank',actions:'withdraw',message:'client is not Active'})
    else res.render('client-actions', {title:'Shmeckle Bank',action: 'withdraw', message:''})
})

app.post('/api/:id/withdraw', (req,res) => {
    const { amount } = req.body
    const { id } = req.params
    const client = getClient(id)
    const isUpdated = updateClient(id, 'withdraw', amount)
    if (isUpdated) res.render('client-actions', {title:'Shmeckle Bank',actions:'withdraw', message:`cash withdrawn. current shmeckle amount: ${client.cash-amount}`})
    else res.status(400).render('client-actions', {title:'Shmeckle Bank',id:id, actions:'withdraw', message:'client reached his max credit limit'})
})

//deposit to user

app.get('/api/:id/deposit', (req,res) => {
    const { id } = req.params
    const isExist = getClient(id)
    if (!isExist) return res.status(400).render('client-actions',{title:'Shmeckle Bank',actions:'deposit',message:'client doesnt exist'})
    if (!isExist.isActive) return res.status(400).render('client-actions',{title:'Shmeckle Bank',actions:'deposit',message:'client is not Active'})
    else res.render('client-actions', {title:'Shmeckle Bank',action: 'deposit', message:''})
})

app.post('/api/:id/deposit', (req,res) => {
    const { id } = req.params
    const { amount } = req.body
    const client = getClient(id)
    const isUpdated = updateClient(id, 'deposit', amount)
    if (isUpdated) res.render('client-actions', {title:'Shmeckle Bank',id:id, action:'deposit', message: `depositted ${amount} shmeckles to the client with the id ${id}. 
     current amount of shmeckles: ${client.cash+ +amount}`})    
})

//update user's credit
app.get('/api/:id/updateCredit', (req,res) => {
    const { id } = req.params
    const isExist = getClient(id)
    if (!isExist) return res.status(400).render('client-actions',{title:'Shmeckle Bank',actions:'update  credit with',message:'client doesnt exist'})
    if (!isExist.isActive) return res.status(400).render('client-actions',{title:'Shmeckle Bank',actions:'update  credit with',message:'client is not Active'})
    else res.render('client-actions', {title:'Shmeckle Bank',action: 'update  credit with', message:''})
})

app.post('/api/:id/updateCredit', (req,res) => {
    const { id } = req.params
    const { amount : newCredit } = req.body
    const isUpdated = updateClient(id,'credit', newCredit)
    if (isUpdated) res.render('client-actions', {title:'Shmeckle Bank',id:id,action:'update  credit with', message: `client with the id  ${id} new credit is ${newCredit} shmeckles` })
})

app.post('/api/:id/delete', (req,res) => {
    const { id } = req.params
    const clients = loadData()
    const clientIdx = clients.findIndex(client => client.passportId === id)
    clients.splice(clientIdx,1)
    saveData(clients)
    res.redirect('/api/')
})



app.listen(PORT, () => console.log(`listening on port ${PORT}`))