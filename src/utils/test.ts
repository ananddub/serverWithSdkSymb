
class CreateTable {
    obj = {}
    constructor(value) {
        console.log("value ", value)
    }

}




const branchSchema = new CreateTable({
    name: { type: String, required: true },
    location: {
        lattitude: { type: Number },
        longitude: { type: Number }
    },
    address: { type: String },
    deliveryPartner: {
        type: 1,
        ref: 'Delivery'
    }
})

