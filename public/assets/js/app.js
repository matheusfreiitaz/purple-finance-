const app = Vue.createApp({
    data() {
        return {
            activeView: 'dashboard',
            transactionTab: 'add', // 'add', 'list', 'history'
            categories: ['Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Moradia', 'Salario'],
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
            // Histórico mensal
            months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
            selectedMonth: new Date().getMonth(),
            selectedYear: new Date().getFullYear(),
            monthlyData: null
        };
    },
    computed: {
        balance() {
            return this.transactions.reduce((sum, transaction) => {
                return transaction.type === 'income' ? sum + transaction.amount : sum - transaction.amount;
            }, 0);
        },
        monthlyIncome() {
            return this.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        },
        monthlyExpenses() {
            return this.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        },
        availableYears() {
            const years = new Set();
            const currentYear = new Date().getFullYear();
            
            // Adiciona o ano atual e mais 5 anos para frente e para trás
            for (let i = currentYear - 5; i <= currentYear + 5; i++) {
                years.add(i);
            }
            
            // Adiciona anos das transações existentes
            this.transactions.forEach(t => {
                const date = new Date(t.date);
                years.add(date.getFullYear());
            });
            
            return Array.from(years).sort((a, b) => b - a);
        }
    },
    methods: {
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
                this.newTransaction = { description: '', amount: 0, category: 'Alimentação', type: 'expense' };
                this.saveData();
                this.renderCharts();
            }
        },
        
        editTransaction(transaction) {
            this.editingTransaction = transaction.id;
            this.editedTransaction = { ...transaction };
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
        
        addGoal() {
            if (this.newGoal.description && this.newGoal.target > 0) {
                this.goals.push({
                    id: Date.now(),
                    description: this.newGoal.description,
                    target: parseFloat(this.newGoal.target),
                    current: parseFloat(this.newGoal.current)
                });
                this.newGoal = { description: '', target: 0, current: 0 };
                this.saveData();
            }
        },
        
        editGoal(goal) {
            this.editingGoal = goal.id;
            this.editedGoal = { ...goal };
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

        deleteTransaction(id) {
            this.transactions = this.transactions.filter(transaction => transaction.id !== id);
            this.saveData();
            this.renderCharts();
        },

        deleteGoal(id) {
            this.goals = this.goals.filter(goal => goal.id !== id);
            this.saveData();
        },

        formatCurrency(amount) {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
        },

        formatDate(date) {
            return new Date(date).toLocaleDateString();
        },

        clearData() {
            localStorage.removeItem('transactions');
            localStorage.removeItem('goals');
            this.transactions = [];
            this.goals = [];
        },

        saveData() {
            localStorage.setItem('transactions', JSON.stringify(this.transactions));
            localStorage.setItem('goals', JSON.stringify(this.goals));
        },

        renderCharts() {
            this.renderPieChart();
            this.renderLineChart();
        },

        renderPieChart() {
            const ctx = this.$refs.pieChart;
            
            // Destruir gráfico anterior se existir
            if (this.pieChartInstance) {
                this.pieChartInstance.destroy();
            }
            
            const categories = this.categories;
            const data = categories.map(category => {
                return this.transactions
                    .filter(t => t.category === category && t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0);
            });
            
            // Manter todas as categorias, mesmo com valor zero
            const filteredLabels = categories;
            const filteredData = data;
            
            this.pieChartInstance = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: filteredLabels,
                    datasets: [{
                        data: filteredData,
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                            '#9966FF', '#FF9F40', '#8AC24A', '#FF5722',
                            '#607D8B', '#9C27B0'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'right',
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
                                    }).format(value)}${total > 0 ? ` (${percentage}%)` : ''}`;
                                }
                            }
                        }
                    }
                }
            });
        },
        
        renderLineChart() {
            const ctx = this.$refs.lineChart;
            
            // Destruir gráfico anterior se existir
            if (this.lineChartInstance) {
                this.lineChartInstance.destroy();
            }
            
            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            const currentMonth = new Date().getMonth();
            
            // Pegar os últimos 6 meses (incluindo o atual)
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
                            borderColor: '#4BC0C0',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            tension: 0.3,
                            fill: true
                        },
                        {
                            label: 'Despesas',
                            data: expenseData,
                            borderColor: '#FF6384',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            tension: 0.3,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
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
                            }
                        }
                    }
                }
            });
        },
        
        // Métodos para o histórico mensal
        loadMonthlyData() {
            const monthTransactions = this.transactions.filter(t => {
                const date = new Date(t.date);
                return date.getMonth() === this.selectedMonth && 
                       date.getFullYear() === this.selectedYear;
            });
            
            const totalIncome = monthTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
            
            const totalExpenses = monthTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
            
            const balance = totalIncome - totalExpenses;
            
            // Calcular despesas por categoria
            const expensesByCategory = {};
            this.categories.forEach(category => {
                const amount = monthTransactions
                    .filter(t => t.category === category && t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0);
                
                if (amount > 0) {
                    expensesByCategory[category] = amount;
                }
            });
            
            this.monthlyData = {
                totalIncome,
                totalExpenses: totalExpenses,
                balance,
                expensesByCategory,
                transactions: monthTransactions
            };
        }
    },

    mounted() {
        const savedTransactions = JSON.parse(localStorage.getItem('transactions')) || [];
        const savedGoals = JSON.parse(localStorage.getItem('goals')) || [];
        this.transactions = savedTransactions;
        this.goals = savedGoals;
        this.renderCharts();
        
        // Configurar mês e ano atual
        const now = new Date();
        this.selectedMonth = now.getMonth();
        this.selectedYear = now.getFullYear();
    }
});

app.mount('#app');
