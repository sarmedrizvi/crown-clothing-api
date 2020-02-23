const express = require('express')
const cors = require('cors')
const knex = require('knex')
const bcrypt = require('bcrypt-nodejs');
// npm install pg --save
// npm install pg
// npm install knex --save

var db = require('knex')({
	client: 'pg',
	version: '7.2',
	connection: {
		host: '127.0.0.1',
		user: 'postgres',
		password: 'sarmed123',
		database: 'NorthWind'
	}
});

const app = express();
app.use(require('body-parser').json())
app.use(cors())

app.get('/', (req, res) => {
	res.json('This Ecommerce Backend Server')
})

app.get('/categories', (req, res) => {
	db.column(db.raw('* from getCategory()'))
		.then(user => res.json(user))
		.catch(err => res.status(400).json(err))
})


const convertArrayToObject = (array, key) => {

	return array.reduce((obj, item) => {
		return {
			...obj,
			[item[key]]: item,
		};
	}, {});
};

app.get('/categoriesProduct', (req, res) => {
	db.column(db.raw('categoryid,categoryname from getCategory()'))
		.then(user => {
			let obj1 = convertArrayToObject(user, 'categoryname')
			db.column(db.raw('* from getproduct()'))
				.then(item => {
					db.column(db.raw('* from getCountCategory()')).then(count => {
						let arrayOfProducts = []
						for (let i = 1;i <= count[0].count;i++) {
							let arr = item.filter(item => item.categoryid === i)
							arrayOfProducts.push(arr)
						}
						arrayOfProducts.map(item => {
							obj1[item[0].categoryname]['items'] = item
						})
						res.json(obj1)

						// Classic Method
						// for (let j = 0;j < count[0].count ;j++) {
						// 	obj1[arrayOfProducts[j][0].CategoryName]['items'] = arrayOfProducts[j]
						// }
					}
					).catch(err => res.status(400).json(err))
				}).catch(err => res.status(400).json(err))
		}
		)
		.catch(err => res.status(400).json(err))
})

app.post('/signup', (req, res) => {

	const { displayName, email, password, confirmPassword, address, city, postalCode, country, phone } = req.body;

	if (password === confirmPassword) {
		const hash = bcrypt.hashSync(password);
		db.column(db.raw(`* from SignUp('${email}','${hash}','${displayName}','${address}','${city}','${country}','${phone}','${postalCode}')`))
			.then(userEmail => res.json(userEmail[0]))
			.catch(err => res.status(400).json('Something is wrong'))
	}
	else {
		res.status(400).json('Password is not Same')
	}

})

app.post('/SignIn', (req, res) => {

	const { email, password } = req.body;


	db.column(db.raw(`* from SignIn('${email}')`))
		.then(customer => {

			if (customer[0] != null) {
				const hash = bcrypt.compareSync(password, customer[0].hash)
				if (hash) {
					// delete customer[0].hash
					res.json(customer[0])
				}
				else {
					res.json('Wrong Credentials')
				}

			}
			else {
				res.json('no such user')
			}
		})
		.catch(err => res.status(400).json(err))
})

Date.prototype.addDays = (days) => {
	var date = new Date();
	date.setDate(date.getDate() + days);
	return date;
}
// const GetCurrentDate = (date, day, year) => {
// 	const Fulldate = new Date();
// 	return {
// 		customDate: `${date} / ${day} / ${year}`,
// 		currentDate: `${Fulldate.getDate()} / ${Fulldate.getDay()} / ${Fulldate.getFullYear()} `

// 	};
// }
app.post('/completeOrder', (req, res) => {
	// categoryid,categoryname,productid,productname,unitprice,quantity
	const { cartItems, Customer } = req.body;
	const Fulldate = new Date();
	db('orders').insert({ OrderDate: Fulldate.toDateString(), RequiredDate: Fulldate.addDays(10).toDateString(), ShippedDate: Fulldate.addDays(5).toDateString(), ShipAddress: Customer.homeaddress, ShipCountry: Customer.customercountry, ShipCity: Customer.customercity, customerid: Customer.id })
		.returning('OrderID').then(id => {


			cartItems.forEach(item => {
				db('order_details').insert({ OrderID: Number(id[0]), ProductID: item.productid, Quantity: item.quantity, Discount: 0 })
					.catch(console.log)
			})
			res.json(`Congratulation your order has been placed with ID: ${id[0]}`)
		})
		.catch(console.log)

})


app.listen(3000, () => {
	console.log('server is running at 3000')
})
