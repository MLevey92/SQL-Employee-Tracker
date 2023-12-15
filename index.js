const mysql = require('mysql2/promise');
const inquirer = require('inquirer');

console.log(`EMPLOYEE DATABASE TRACKER
--------------------------`)

async function main() {
    const db = await mysql.createConnection(
        {
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'employees_db'
        }
    );

    inquirer
        .prompt([
            {
                type: 'list',
                message: 'What do you want to do?',
                choices: ['View all departments', 'View all roles', 'View all employees', 'Add a department', 'Add a role', 'Add an employee', 'Update an employee role', 'exit'],
                name: 'mainMenu'
            }
        ]).then((response) => {
            switch(response.mainMenu) {
                case 'View all departments':
                    viewDept();
                    break;
                case 'View all roles':
                    viewRoles();
                    break;
                case 'View all employees':
                    viewEmployees();
                    break;
                case 'Add a department':
                    addDept();
                    break;
                case 'Add a role':
                    addRole();
                    break;
                case 'Add an employee':
                    addEmployee();
                    break;
                case 'Update an employee role':
                    updateEmployeeRole();
                    break;
                case 'exit':
                    process.exit(0);
            }
        });

    async function viewDept() {
        const [rows, fields] = await db.execute('SELECT * FROM department');
        console.table(rows);
        main();
    }

    async function viewRoles() {
        const [rows, fields] = await db.execute('SELECT title, salary, name AS department FROM role JOIN department ON role.department_id = department.id');
        console.table(rows);
        main();
    }

    async function viewEmployees() {
        const [rows, fields] = await db.execute('SELECT employee.id, first_name, last_name, title, salary, name AS department, manager_id FROM employee JOIN role ON employee.role_id = role.id JOIN department on role.department_id = department.id');
        console.table(rows);
        main();
    }

    async function addDept() {
        const response = await inquirer.prompt([
            {
                type: 'input',
                message: 'Department Name: ',
                name: 'dept'
            }
        ]);
        try {
            await db.execute(`INSERT INTO department (name) VALUES ("${response.dept}")`);
            console.log(`Added ${response.dept} to database.`);
        } catch (err) {
            console.log(err.sqlMessage);
        }
        
        main();
    }

    async function addRole() {
        //get departments
        const [rows, fields] = await db.execute('SELECT * FROM department');
        
        const depts = [];
        
        for (let i=0;i<rows.length;i++) {
            depts.push(rows[i].name);
        }
        
        const response = await inquirer.prompt([
            {
                type: 'input',
                message: 'Role title: ',
                name: 'title'
            },
            {
                type: 'input',
                message: 'Salary (***.**)',
                name: 'salary'
            },
            {
                type: 'list',
                message: 'Which department? ',
                choices: depts,
                name: 'dept'
            }
        ]);

        let dept_id;
        for (let i=0;i<rows.length;i++) {
            if (rows[i].name===response.dept) {
                dept_id = rows[i].id;
                break;
            }
        }

        await db.execute(`INSERT INTO role (title, salary, department_id) VALUES ("${response.title}", ${response.salary}, ${dept_id})`);
        console.log(`Added ${response.title} to database`);
        main();
    }

    async function addEmployee() {
        //get current employees
        const [rowsEmp, fieldsEmp] = await db.execute('SELECT * FROM EMPLOYEE');
        const employees = ['None'];

        for (let i=0;i<rowsEmp.length;i++) {
            employees.push(`${rowsEmp[i].first_name} ${rowsEmp[i].last_name}`);
        }

        const[rowsRol, fieldsRol] = await db.execute('SELECT * FROM role');
        const roles = [];

        for (let i=0;i<rowsRol.length;i++) {
            roles.push(rowsRol[i].title);
        }
        
        const response = await inquirer.prompt([
            {
                type: 'input',
                message: 'First name: ',
                name: 'first'
            },
            {
                type: 'input',
                message: 'Last name: ',
                name: 'last'
            },
            {
                type: 'list',
                message: 'Which Role? ',
                choices: roles,
                name: 'role'
            },
            {
                type: 'list',
                message: 'Managed by: ',
                choices: employees,
                name: 'manager'
            }
        ]);
        
        
        let role_id;
        let manager_id;

        if (response.manager==='None') {
            manager_id = null;
        } else {
            for (let i=0;i<rowsEmp.length;i++) {
            const fullName = `${rowsEmp[i].first_name} ${rowsEmp[i].last_name}`;
                if (fullName === response.manager) {
                    manager_id = rowsEmp[i].id;
                    break;
                }
            }
        }

        for (let i=0;i<rowsRol.length;i++) {
            if (rowsRol[i].title === response.role) {
                role_id = rowsRol[i].id;
                break;
            }
        }


        
        await db.execute(`INSERT INTO employee (first_name, last_name, role_id, manager_id) 
        VALUES ('${response.first}', '${response.last}', ${role_id}, ${manager_id})`);
        
        console.log(`Added ${response.first} ${response.last} to Database`);

        main();
    }

    async function updateEmployeeRole () {
        const[rowsRol, fieldsRol] = await db.execute('SELECT * FROM role');
        const roles = [];

        for (let i=0;i<rowsRol.length;i++) {
            roles.push(rowsRol[i].title);
        }

        const[rowsEmp, fieldsEmp] = await db.execute('SELECT * FROM employee');
        const employees = [];

        for (let i=0;i<rowsEmp.length;i++) {
            employees.push(`${rowsEmp[i].first_name} ${rowsEmp[i].last_name}`)
        }
        const response = await inquirer.prompt([
            {
                type: 'list',
                message: "Which employee's role do you want to update?",
                choices: employees,
                name: 'employee'
            },
            {
                type: 'list',
                message: 'New role: ',
                choices: roles,
                name: 'role'
            }
        ])
        const fullName = response.employee.split(" ");
        const firstName = fullName[0];
        const lastName = fullName[1];
        let role_id;

        for (let i=0;i<rowsRol.length;i++) {
            if (rowsRol[i].title === response.role) {
                role_id = rowsRol[i].id;
                break;
            }
        }

        await db.execute(`UPDATE employee SET role_id=${role_id} WHERE first_name='${firstName}' AND last_name='${lastName}'`);
        console.log(`Updated ${response.employee}'s role to ${response.role}`);
        main();
    }

}



main();
