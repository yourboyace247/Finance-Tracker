//Inputs for form
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const typeInput = document.getElementById("type");
const dateInput = document.getElementById("date");
const descriptionInput = document.getElementById("description");

//Submit button
const transactionForm = document.getElementById("transaction-form");

//Summary Elements
const totalIncomeEl = document.getElementById("total-income");
const totalExpenseEl = document.getElementById("total-expense");
const balanceEl = document.getElementById("balance");

//Transaction list
const transactionsList = document.getElementById("transactions-list");

//Filters
const monthFilter = document.getElementById("month-filter");
const categoryFilter = document.getElementById("category-filter");
const typeFilter = document.getElementById("type-filter");

//Graphic charts
const categoryChartEl = document.getElementById("category-chart");
const monthlyChartEl = document.getElementById("monthly-chart");

//State variables
let transactions = [];
let categoryChart = null;
let monthlyChart = null;

//Adding a transaction
function addTransaction() {
    transactionForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const amount = Number(amountInput.value);
        const category = categoryInput.value;
        const type = typeInput.value;
        const date = dateInput.value;
        const description = descriptionInput.value;

        if(!validateTransactionInput(amount, type, category, date)) return;

        const transaction = {
            id: Date.now().toString(),
            amount: amount,
            category: category,
            type: type,
            date: date,
            description: description
        };

        transactions.push(transaction);
        saveTransactions();
        renderTransactions();
        updateSummary();
        updateCharts();
        transactionForm.reset();
    });
}

//Saving a transaction
function saveTransactions() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

//Loading transactions
function loadTransactions() {
    const storedData = localStorage.getItem("transactions");

    transactions = storedData ? JSON.parse(storedData) : [];

    renderTransactions();
    updateSummary();
    updateCharts();    
}

function renderTransactions(optionalFiltered = null) {
    const listToRender = optionalFiltered ? optionalFiltered : transactions;

    transactionsList.innerHTML = "";

    if(transactions.length === 0) {
        transactionsList.innerHTML = `
        <div class="empty-state">
                <i class="icon">📊</i>
                <p>There are no registered transactions</p>
                <small>Add your first transaction above</small>
            </div>
        `;
        updateTransactionCounter(0);
        return;
    }

    listToRender.forEach(transaction => {
        const transactionItem = document.createElement("div");
        transactionItem.classList.add("transaction-item");

        transactionItem.innerHTML = `
            <div class="transaction-type ${transaction.type}"></div>
            <div class="transaction-details">
                <div class="transaction-category">${transaction.category}</div>
                <div class="transaction-description">${transaction.description || ""}</div>
                <div class="transaction-date">${transaction.date}</div>
            </div>
            <div class="transaction-amount ${transaction.type}">€${transaction.amount.toFixed(2)}</div>
            <div class="transaction-actions">
                <button class="btn-icon btn-edit">✏️</button>
                <button class="btn-icon btn-delete">🗑️</button>
            </div>
        `;

        transactionItem.querySelector(".btn-edit").addEventListener("click", () => openEditModal(transaction));
        transactionItem.querySelector(".btn-delete").addEventListener("click", () => deleteTransaction(transaction.id));

        transactionsList.appendChild(transactionItem);
    });

    updateTransactionCounter(listToRender);
}

//Updating income, expenses, and total balance
function updateSummary() {
    let totalIncome = 0
    let totalExpense = 0

    transactions.forEach(transaction => {
        if (transaction.type === "income") totalIncome += parseFloat(transaction.amount);
        else if (transaction.type === "expense") totalExpense += parseFloat(transaction.amount);
    });

    const balance = totalIncome - totalExpense;

    totalIncomeEl.textContent = `€${totalIncome.toFixed(2)}`;
    totalExpenseEl.textContent = `€${totalExpense.toFixed(2)}`;
    balanceEl.textContent = `€${balance.toFixed(2)}`;

    balanceEl.classList.toggle("text-success", balance >= 0);
    balanceEl.classList.toggle("text-danger", balance < 0);
}

//Validation input
function validateTransactionInput(amount, type, category, date) {
    if (!amount || isNaN(amount) || amount <= 0) { console.error("Amount must be a number greater than 0"); return false; }
    if (!type) { console.error("Type is required"); return false; }
    if (!category) { console.error("Category is required"); return false; }
    if (!date) { console.error("Date is required"); return false; }
    return true;
}

//Delete income input or expense input
function deleteTransaction(transactionId) {
    const confirmed = confirm("Are you sure you want to delete this transaction?");
    if (!confirmed) return;

    transactions = transactions.filter(t => t.id !== transactionId);
    saveTransactions();
    renderTransactions();
    updateSummary();
    updateCharts();
}

//Open edit modal
function openEditModal(transaction) {
    const editModal = document.getElementById("edit-modal");
    const editForm = document.getElementById("edit-form");

    if (!editModal || !editForm) return;

    editForm.innerHTML = `
        <div class="form-group">
            <label for="edit-amount">Amount (€) *</label>
            <input type="number" id="edit-amount" value="${transaction.amount}" step="0.01" required>
        </div>
        <div class="form-group">
            <label for="edit-type">Type *</label>
            <select id="edit-type" required>
                <option value="income" ${transaction.type === "income" ? "selected" : ""}>Income</option>
                <option value="expense" ${transaction.type === "expense" ? "selected" : ""}>Expense</option>
            </select>
        </div>
        <div class="form-group">
            <label for="edit-category">Category *</label>
            <input type="text" id="edit-category" value="${transaction.category}" required>
        </div>
        <div class="form-group">
            <label for="edit-date">Date *</label>
            <input type="date" id="edit-date" value="${transaction.date}" required>
        </div>
        <div class="form-group">
            <label for="edit-description">Description</label>
            <textarea id="edit-description">${transaction.description || ""}</textarea>
        </div>
        <button type="submit" class="btn-primary">Save Changes</button>
    `;

    editModal.style.display = "block";

    const closeBtn = editModal.querySelector(".close-btn");
    if (closeBtn) closeBtn.onclick = () => editModal.style.display = "none";

    const submitHandler = (e) => {
        e.preventDefault();

        transaction.amount = parseFloat(document.getElementById("edit-amount").value);
        transaction.type = document.getElementById("edit-type").value;
        transaction.category = document.getElementById("edit-category").value;
        transaction.date = document.getElementById("edit-date").value;
        transaction.description = document.getElementById("edit-description").value;

        saveTransactions();
        renderTransactions();
        updateSummary();
        updateCharts();
        editModal.style.display = "none";

        editForm.removeEventListener("submit", submitHandler);
    };

    editForm.addEventListener("submit", submitHandler);
}

// Close modal when clicking outside
window.addEventListener("click", (event) => {
    const editModal = document.getElementById("edit-modal");
    if (event.target === editModal) editModal.style.display = "none";
});

//Update charts
function updateCharts (optionalList = null) {
    const dataSource = optionalList ? optionalList : transactions;

    const categoryTotals = {};

    dataSource.forEach(tx => {
        if(tx.type === "expense") categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
    });

    const categoryLabels = Object.keys(categoryTotals);
    const categoryValues = Object.values(categoryTotals);
    if (categoryChart) categoryChart.destroy();
    categoryChart = new Chart(categoryChartEl, {
        type: "pie",
        data: { labels: categoryLabels, datasets: [{ data: categoryValues }] }
    });

    const monthsIncome = Array(12).fill(0);
    const monthsExpense = Array(12).fill(0);

    dataSource.forEach(tx => {
        const monthIndex = new Date(tx.date).getMonth();
        if (tx.type === "income") monthsIncome[monthIndex] += tx.amount;
        if (tx.type === "expense") monthsExpense[monthIndex] += tx.amount;
        
    });

    if (monthlyChart) monthlyChart.destroy();
    monthlyChart = new Chart(monthlyChartEl, {
        type: "bar",
        data: {
            labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
            datasets: [
                { label: "Income", data: monthsIncome },
                { label: "Expense", data: monthsExpense }
            ]
        }
    });
}

//Laoding transactions
function loadTransactions() {
    const storedData = localStorage.getItem("transactions");
    
    if(storedData) {
        transactions = JSON.parse(storedData);
    } else {
        transactions = [];
    }

    renderTransactions();
    updateSummary();
    updateCharts(); // Αρχική render charts
}

// Applying filters
function applyFilters() {
    let filteredTransactions = transactions

    if (monthFilter.value !== "all") {
        filteredTransactions = filteredTransactions.filter(t => new Date(t.date).getMonth() + 1 == monthFilter.value);
    }

    if (typeFilter.value !== "all") {
        filteredTransactions = filteredTransactions.filter(transaction => transaction.type === typeFilter.value);
    }

    if (categoryFilter.value !== "all") {
        filteredTransactions = filteredTransactions.filter(transaction => transaction.category === categoryFilter.value);
    }

    renderTransactions(filteredTransactions);
    updateCharts(filteredTransactions);
}

monthFilter.addEventListener("change", () => applyFilters());
typeFilter.addEventListener("change", () => applyFilters());
categoryFilter.addEventListener("change", () => applyFilters());

//Update transactions counter
function updateTransactionCounter(filteredTransactions = null) {
    const count = filteredTransactions ? filteredTransactions.length : transactions.length;
    
    const counterEl = document.getElementById("transactions-count");
    if (counterEl) counterEl.textContent = `${count} Transaction${count !== 1 ? "s" : ""}`;
}

window.addEventListener("keydown", (event) => {
    if(event.key === "Escape") closeEditModal();
});

//Closing modal
function closeEditModal() {
    const editModal = document.getElementById("edit-modal");
    if(editModal) editModal.style.display = "none";
}

addTransaction();
loadTransactions();