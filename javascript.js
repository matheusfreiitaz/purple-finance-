    <script>
        const app = Vue.createApp({
            data() {
                return {
                    activeView: 'dashboard',
                    mobileMenuOpen: false,
                    transactionTab: 'add',
                    transactionSearch: '',
                    showCategoryDetails: false,
                    showGoalForm: false,
                    showCategoryForm: false,
                    
                    categories: [
                        { name: 'Alimentação', color: '#FF6384' },
                        { name: 'Transporte', color: '#36A2EB' },
                        { name: 'Lazer', color: '#FFCE56' },
                        { name: 'Saúde', color: '#4BC0C0' },
                        { name: 'Moradia', color: '#9966FF' },
                        { name: 'Salário', color: '#8AC24A' }
                    ],
                    
                    newCategory: { name: '', color: '#6D28D9' },
                    editingCategory: null,
                    editedCategory: null,
                    
                    transactions: [],
                    goals: [],
                    
                    newTransaction: { description: '', amount: 0, category: 'Alimentação', type: 'expense' },
                    newGoal: { description: '', target: 0, current: 0 },
                    
                    editingTransaction: null,
                    editedTransaction: null,
                    editingGoal: null,
                    editedGoal: null,
                    
                    lineChartInstance: null,
                    pieChartInstance: null,
                    
                    // Modals
                    showClearDataModal: false,
                    showDeleteModal: false,
                    deleteModalMessage: '',
                    itemToDelete: null,
                    deleteType: null
                };
            },
            
            computed: {
                balance() {
                    return this.transactions.reduce((sum, transaction) => {
                        return transaction.type === 'income' ? sum + transaction.amount : sum - transaction.amount;
                    }, 0);
                },
                
                monthlyIncome() {
                    const currentMonth = new Date().getMonth();
                    const currentYear = new Date().getFullYear();
                    
                    return this.transactions
                        .filter(t => {
                            const date = new Date(t.date);
                            return date.getMonth() === currentMonth && 
                                   date.getFullYear() === currentYear && 
                                   t.type === 'income';
                        })
                        .reduce((sum, t) => sum + t.amount, 0);
                },
                
                monthlyExpenses() {
                    const currentMonth = new Date().getMonth();
                    const currentYear = new Date().getFullYear();
                    
                    return this.transactions
                        .filter(t => {
                            const date = new Date(t.date);
                            return date.getMonth() === currentMonth && 
                                   date.getFullYear() === currentYear && 
                                   t.type === 'expense';
                        })
                        .reduce((sum, t) => sum + t.amount, 0);
                },
                
                recentTransactions() {
                    return [...this.transactions]
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .slice(0, 5);
                },
                
                filteredTransactions() {
                    if (!this.transactionSearch) return this.transactions;
                    
                    const searchTerm = this.transactionSearch.toLowerCase();
                    return this.transactions.filter(t => 
                        t.description.toLowerCase().includes(searchTerm) || 
                        t.category.toLowerCase().includes(searchTerm)
                    );
                },
                
                expensesByCategory() {
                    const result = {};
                    const currentMonth = new Date().getMonth();
                    const currentYear = new Date().getFullYear();
                    
                    this.transactions.forEach(t => {
                        const date = new Date(t.date);
                        if (date.getMonth() === currentMonth && 
                            date.getFullYear() === currentYear && 
                            t.type === 'expense') {
                            
                            if (!result[t.category]) {
                                result[t.category] = 0;
                            }
                            result[t.category] += t.amount;
                        }
                    });
                    
                    return result;
                }
            },
            
            methods: {
                // Category Methods
                addCategory() {
                    if (this.newCategory.name.trim()) {
                        this.categories.push({
                            name: this.newCategory.name.trim(),
                            color: this.newCategory.color
                        });
                        this.resetCategoryForm();
                        this.saveData();
                        this.renderCharts();
                    }
                },
                
                editCategory(index) {
                    this.editingCategory = index;
                    this.editedCategory = { ...this.categories[index] };
                    this.showCategoryForm = false;
                },
                
                saveCategoryEdit() {
                    if (this.editingCategory !== null && this.editedCategory.name.trim()) {
                        this.categories[this.editingCategory] = { ...this.editedCategory };
                        this.cancelCategoryEdit();
                        this.saveData();
                        this.renderCharts();
                    }
                },
                
                cancelCategoryEdit() {
                    this.editingCategory = null;
                    this.editedCategory = null;
                },
                
                resetCategoryForm() {
                    this.newCategory = { name: '', color: '#6D28D9' };
                    this.showCategoryForm = false;
                },
                
                initDeleteCategory(index) {
                    this.itemToDelete = index;
                    this.deleteType = 'category';
                    this.deleteModalMessage = `Tem certeza que deseja excluir a categoria "${this.categories[index].name}"? Todas as transações associadas serão marcadas como "Sem categoria".`;
                    this.showDeleteModal = true;
                },
                
                countTransactionsByCategory(categoryName) {
                    return this.transactions.filter(t => t.category === categoryName).length;
                },
                
                getCategoryTotal(categoryName) {
                    return this.transactions.reduce((sum, t) => {
                        if (t.category === categoryName) {
                            return t.type === 'income' ? sum + t.amount : sum - t.amount;
                        }
                        return sum;
                    }, 0);
                },
                
                // Transaction Methods
                addTransaction() {
                    if (this.newTransaction.description && this.newTransaction.amount > 0) {
                        this.transactions.push({
                            id: Date.now(),
                            description: this.newTransaction.description,
                            amount: parseFloat(this.newTransaction.amount),
                            category: this.newTransaction.category,
                            type: this.newTransaction.type,
                            date: new Date().toISOString()
                        });
                        this.resetTransactionForm();
                        this.saveData();
                        this.renderCharts();
                    }
                },
                
                editTransaction(transaction) {
                    this.editingTransaction = transaction.id;
                    this.editedTransaction = { ...transaction };
                    this.transactionTab = 'list';
                },
                
                saveEdit() {
                    const index = this.transactions.findIndex(t => t.id === this.editingTransaction);
                    if (index !== -1) {
                        this.transactions[index] = { ...this.editedTransaction };
                        this.saveData();
                        this.cancelEdit();
                        this.renderCharts();
                    }
                },
                
                cancelEdit() {
                    this.editingTransaction = null;
                    this.editedTransaction = null;
                },
                
                resetTransactionForm() {
                    this.newTransaction = { 
                        description: '', 
                        amount: 0, 
                        category: this.categories[0]?.name || 'Outros', 
                        type: 'expense' 
                    };
                },
                
                initDeleteTransaction(id) {
                    const transaction = this.transactions.find(t => t.id === id);
                    this.itemToDelete = id;
                    this.deleteType = 'transaction';
                    this.deleteModalMessage = `Tem certeza que deseja excluir a transação "${transaction.description}" de ${this.formatCurrency(transaction.amount)}?`;
                    this.showDeleteModal = true;
                },
                
                // Goal Methods
                addGoal() {
                    if (this.newGoal.description && this.newGoal.target > 0) {
                        this.goals.push({
                            id: Date.now(),
                            description: this.newGoal.description,
                            target: parseFloat(this.newGoal.target),
                            current: parseFloat(this.newGoal.current)
                        });
                        this.resetGoalForm();
                        this.saveData();
                    }
                },
                
                editGoal(goal) {
                    this.editingGoal = goal.id;
                    this.editedGoal = { ...goal };
                    this.showGoalForm = false;
                },
                
                saveGoalEdit() {
                    const index = this.goals.findIndex(g => g.id === this.editingGoal);
                    if (index !== -1) {
                        this.goals[index] = { ...this.editedGoal };
                        this.saveData();
                        this.cancelGoalEdit();
                    }
                },
                
                cancelGoalEdit() {
                    this.editingGoal = null;
                    this.editedGoal = null;
                },
                
                resetGoalForm() {
                    this.newGoal = { description: '', target: 0, current: 0 };
                    this.showGoalForm = false;
                },
                
                initDeleteGoal(id) {
                    const goal = this.goals.find(g => g.id === id);
                    this.itemToDelete = id;
                    this.deleteType = 'goal';
                    this.deleteModalMessage = `Tem certeza que deseja excluir a meta "${goal.description}"?`;
                    this.showDeleteModal = true;
                },
                
                // Modal Methods
                confirmDelete() {
                    if (this.deleteType === 'transaction') {
                        this.transactions = this.transactions.filter(transaction => transaction.id !== this.itemToDelete);
                    } else if (this.deleteType === 'goal') {
                        this.goals = this.goals.filter(goal => goal.id !== this.itemToDelete);
                    } else if (this.deleteType === 'category') {
                        // Before deleting, update transactions with this category to "Uncategorized"
                        const categoryName = this.categories[this.itemToDelete].name;
                        this.transactions.forEach(t => {
                            if (t.category === categoryName) {
                                t.category = 'Outros';
                            }
                        });
                        this.categories.splice(this.itemToDelete, 1);
                    }
                    
                    this.saveData();
                    if (this.deleteType !== 'goal') {
                        this.renderCharts();
                    }
                    this.cancelDelete();
                },
                
                cancelDelete() {
                    this.showDeleteModal = false;
                    this.itemToDelete = null;
                    this.deleteType = null;
                    this.deleteModalMessage = '';
                },
                
                confirmClearData() {
                    this.clearData();
                    this.showClearDataModal = false;
                },
                
                // Helper Methods
                getCategoryColor(categoryName) {
                    const category = this.categories.find(c => c.name === categoryName);
                    return category ? category.color : '#CCCCCC';
                },
                
                formatCurrency(amount) {
                    return new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                    }).format(amount);
                },
                
                formatDate(dateString) {
                    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
                    return new Date(dateString).toLocaleDateString('pt-BR', options);
                },
                
                formatDateShort(dateString) {
                    const options = { day: '2-digit', month: '2-digit' };
                    return new Date(dateString).toLocaleDateString('pt-BR', options);
                },
                
                clearData() {
                    localStorage.removeItem('transactions');
                    localStorage.removeItem('goals');
                    localStorage.removeItem('categories');
                    this.transactions = [];
                    this.goals = [];
                    this.categories = [
                        { name: 'Alimentação', color: '#FF6384' },
                        { name: 'Transporte', color: '#36A2EB' },
                        { name: 'Lazer', color: '#FFCE56' },
                        { name: 'Saúde', color: '#4BC0C0' },
                        { name: 'Moradia', color: '#9966FF' },
                        { name: 'Salário', color: '#8AC24A' }
                    ];
                    this.renderCharts();
                },
                
                saveData() {
                    localStorage.setItem('transactions', JSON.stringify(this.transactions));
                    localStorage.setItem('goals', JSON.stringify(this.goals));
                    localStorage.setItem('categories', JSON.stringify(this.categories));
                },
                
                renderCharts() {
                    this.renderPieChart();
                    this.renderLineChart();
                },
                
                renderPieChart() {
                    const ctx = this.$refs.pieChart;
                    
                    if (this.pieChartInstance) {
                        this.pieChartInstance.destroy();
                    }
                    
                    if (!ctx) return;
                    
                    const categoryNames = this.categories.map(c => c.name);
                    const data = categoryNames.map(category => {
                        return this.transactions
                            .filter(t => t.category === category && t.type === 'expense')
                            .reduce((sum, t) => sum + t.amount, 0);
                    });
                    
                    const backgroundColors = this.categories.map(c => c.color);
                    
                    this.pieChartInstance = new Chart(ctx, {
                        type: 'pie',
                        data: {
                            labels: categoryNames,
                            datasets: [{
                                data: data,
                                backgroundColor: backgroundColors,
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'right',
                                    labels: {
                                        usePointStyle: true,
                                        padding: 20
                                    }
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            const label = context.label || '';
                                            const value = context.raw || 0;
                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                            return `${label}: ${new Intl.NumberFormat('pt-BR', { 
                                                style: 'currency', 
                                                currency: 'BRL' 
                                            }).format(value)} (${percentage}%)`;
                                        }
                                    }
                                }
                            }
                        }
                    });
                },
                
                renderLineChart() {
                    const ctx = this.$refs.lineChart;
                    
                    if (this.lineChartInstance) {
                        this.lineChartInstance.destroy();
                    }
                    
                    if (!ctx) return;
                    
                    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                    const currentMonth = new Date().getMonth();
                    
                    const displayMonths = [];
                    for (let i = 5; i >= 0; i--) {
                        const monthIndex = (currentMonth - i + 12) % 12;
                        displayMonths.push(months[monthIndex]);
                    }
                    
                    const incomeData = displayMonths.map((_, index) => {
                        const monthIndex = (currentMonth - 5 + index + 12) % 12;
                        return this.transactions
                            .filter(t => {
                                const date = new Date(t.date);
                                return date.getMonth() === monthIndex && t.type === 'income';
                            })
                            .reduce((sum, t) => sum + t.amount, 0);
                    });
                    
                    const expenseData = displayMonths.map((_, index) => {
                        const monthIndex = (currentMonth - 5 + index + 12) % 12;
                        return this.transactions
                            .filter(t => {
                                const date = new Date(t.date);
                                return date.getMonth() === monthIndex && t.type === 'expense';
                            })
                            .reduce((sum, t) => sum + t.amount, 0);
                    });
                    
                    this.lineChartInstance = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: displayMonths,
                            datasets: [
                                {
                                    label: 'Receitas',
                                    data: incomeData,
                                    borderColor: '#10B981',
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    tension: 0.3,
                                    fill: true,
                                    borderWidth: 2,
                                    pointBackgroundColor: '#10B981',
                                    pointRadius: 4
                                },
                                {
                                    label: 'Despesas',
                                    data: expenseData,
                                    borderColor: '#EF4444',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    tension: 0.3,
                                    fill: true,
                                    borderWidth: 2,
                                    pointBackgroundColor: '#EF4444',
                                    pointRadius: 4
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'top',
                                    labels: {
                                        usePointStyle: true
                                    }
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            const label = context.dataset.label || '';
                                            const value = context.raw || 0;
                                            return `${label}: ${new Intl.NumberFormat('pt-BR', { 
                                                style: 'currency', 
                                                currency: 'BRL' 
                                            }).format(value)}`;
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        callback: function(value) {
                                            return new Intl.NumberFormat('pt-BR', { 
                                                style: 'currency', 
                                                currency: 'BRL' 
                                            }).format(value);
                                        }
                                    },
                                    grid: {
                                        color: 'rgba(0, 0, 0, 0.05)'
                                    }
                                },
                                x: {
                                    grid: {
                                        display: false
                                    }
                                }
                            }
                        }
                    });
                }
            },
            
            mounted() {
                const savedTransactions = JSON.parse(localStorage.getItem('transactions')) || [];
                const savedGoals = JSON.parse(localStorage.getItem('goals')) || [];
                const savedCategories = JSON.parse(localStorage.getItem('categories')) || this.categories;
                
                this.transactions = savedTransactions;
                this.goals = savedGoals;
                this.categories = savedCategories.length ? savedCategories : this.categories;
                
                // Definir categoria padrão para nova transação
                if (this.categories.length > 0) {
                    this.newTransaction.category = this.categories[0].name;
                }
                
                this.renderCharts();
            }
        });
        
        app.mount('#app');
    </script>
