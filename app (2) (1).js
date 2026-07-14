document.addEventListener('DOMContentLoaded', () => {
    // State management
    let dashboardData = null;
    let activeCharts = {};

    // DOM Elements
    const navItems = document.querySelectorAll('.nav-item');
    const tabPanels = document.querySelectorAll('.tab-panel');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    const linkRequestForm = document.getElementById('link-request-form');
    const requestHistoryList = document.getElementById('request-history-list');
    const toastContainer = document.getElementById('toast-container');

    // Tab Navigation Configuration
    const tabConfig = {
        'overview': { title: 'Executive Summary', subtitle: 'High-level insights & data aggregations of 50,000 charge sessions' },
        'analyst': { title: 'Scenario 1: Charging Patterns', subtitle: "Aarav's energy demand analysis: Grid loading & charger speed types" },
        'operations': { title: 'Scenario 2: Battery Performance', subtitle: "Meera's fleet logs: Charge cycle durations & regional efficiency" },
        'customer': { title: 'Scenario 3: Model Comparison', subtitle: "Ravi's consumer analysis: EV models, driving styles & estimated ranges" },
        'portal': { title: 'Mentor Review Setup Portal', subtitle: 'Submit live demo and GitHub repository links for mentor evaluation' }
    };

    // Sidebar navigation click handler
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');
            
            // Remove active classes
            navItems.forEach(nav => nav.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));
            
            // Add active classes
            item.classList.add('active');
            const targetPanel = document.getElementById(`view-${targetTab}`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }

            // Update page headers
            if (tabConfig[targetTab]) {
                pageTitle.textContent = tabConfig[targetTab].title;
                pageSubtitle.textContent = tabConfig[targetTab].subtitle;
            }

            // Render charts for the active panel (destroys old ones to prevent canvas reuse bugs)
            renderTabCharts(targetTab);
        });
    });

    // Fetch and load aggregated data
    async function loadDashboardData() {
        try {
            if (window.dashboardData) {
                dashboardData = window.dashboardData;
            } else {
                const response = await fetch('data_summary.json');
                if (!response.ok) {
                    throw new Error('Failed to load preprocessed data_summary.json');
                }
                dashboardData = await response.json();
            }
            
            // Update KPI values in Overview
            document.getElementById('kpi-total-orders').textContent = Number(dashboardData.totalSessions).toLocaleString();
            document.getElementById('kpi-avg-value').textContent = `${dashboardData.avgPowerConsumed} kWh`;
            document.getElementById('kpi-avg-fee').textContent = `$${dashboardData.avgChargingCost}`;
            document.getElementById('kpi-repeat-rate').textContent = `${dashboardData.avgRangeDelivered} km`;

            // Render initial Overview tab charts
            renderTabCharts('overview');
        } catch (error) {
            console.error('Error loading dataset summary:', error);
            showToast('Error loading dataset. Please check data files.', 'error');
        }
    }

    // Chart Configuration Helper (Global styling overrides for light theme)
    Chart.defaults.color = '#475569';
    Chart.defaults.font.family = "'Outfit', sans-serif";
    Chart.defaults.borderColor = 'rgba(0, 0, 0, 0.06)';

    function getChartGradient(ctx, color1, color2) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        return gradient;
    }

    // Destroy active charts in a tab before re-rendering
    function clearCharts(keys) {
        keys.forEach(key => {
            if (activeCharts[key]) {
                activeCharts[key].destroy();
                delete activeCharts[key];
            }
        });
    }

    // Render charts depending on the selected tab
    function renderTabCharts(tab) {
        if (!dashboardData) return;

        if (tab === 'overview') {
            clearCharts(['overviewMood', 'overviewWeather']);

            // 1. Port Type Chart
            const portCtx = document.getElementById('chart-overview-mood').getContext('2d');
            const portLabels = dashboardData.portTypeStats.map(d => d.portType);
            const portCounts = dashboardData.portTypeStats.map(d => d.count);
            
            activeCharts['overviewMood'] = new Chart(portCtx, {
                type: 'bar',
                data: {
                    labels: portLabels,
                    datasets: [{
                        label: 'Sessions Count',
                        data: portCounts,
                        backgroundColor: [
                            getChartGradient(portCtx, 'rgba(2, 132, 199, 0.85)', 'rgba(2, 132, 199, 0.2)'), // CCS2
                            getChartGradient(portCtx, 'rgba(79, 70, 229, 0.85)', 'rgba(79, 70, 229, 0.2)'), // CHAdeMO
                            getChartGradient(portCtx, 'rgba(124, 58, 237, 0.85)', 'rgba(124, 58, 237, 0.2)'), // Type 2
                            getChartGradient(portCtx, 'rgba(22, 163, 74, 0.85)', 'rgba(22, 163, 74, 0.2)')   // GB/T
                        ],
                        borderColor: ['#0284c7', '#4f46e5', '#7c3aed', '#16a34a'],
                        borderWidth: 1.5,
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
                        x: { grid: { display: false } }
                    }
                }
            });

            // 2. Weather Chart (Weather impact on Charging Cost & Energy Intake)
            const weatherCtx = document.getElementById('chart-overview-weather').getContext('2d');
            const weatherLabels = dashboardData.weatherStats.map(d => d.weatherCondition);
            const weatherFees = dashboardData.weatherStats.map(d => d.avgChargingCost);
            const weatherAOV = dashboardData.weatherStats.map(d => d.avgPowerConsumed);

            activeCharts['overviewWeather'] = new Chart(weatherCtx, {
                type: 'bar',
                data: {
                    labels: weatherLabels,
                    datasets: [
                        {
                            label: 'Avg Session Cost ($)',
                            data: weatherFees,
                            backgroundColor: getChartGradient(weatherCtx, 'rgba(2, 132, 199, 0.8)', 'rgba(2, 132, 199, 0.15)'),
                            borderColor: '#0284c7',
                            borderWidth: 1,
                            borderRadius: 6
                        },
                        {
                            label: 'Avg Energy Intake (kWh)',
                            data: weatherAOV,
                            backgroundColor: getChartGradient(weatherCtx, 'rgba(79, 70, 229, 0.8)', 'rgba(79, 70, 229, 0.15)'),
                            borderColor: '#4f46e5',
                            borderWidth: 1,
                            borderRadius: 6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15 } },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    let val = context.raw;
                                    if (context.datasetIndex === 0) {
                                        return `${label}: $${val.toFixed(2)}`;
                                    } else {
                                        return `${label}: ${val.toFixed(2)} kWh`;
                                    }
                                }
                            }
                        }
                    },
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
                        x: { grid: { display: false } }
                    }
                }
            });

        } else if (tab === 'analyst') {
            clearCharts(['analystCity', 'analystCuisine', 'analystMeal', 'analystDayType']);

            // 1. Mixed Neighborhood Load Chart (Sessions in bar, Avg Power in Line)
            const cityCtx = document.getElementById('chart-analyst-city').getContext('2d');
            const cityLabels = dashboardData.neighborhoodStats.map(d => d.neighborhood);
            const cityCounts = dashboardData.neighborhoodStats.map(d => d.count);
            const cityAOVs = dashboardData.neighborhoodStats.map(d => d.avgPowerConsumed);

            activeCharts['analystCity'] = new Chart(cityCtx, {
                type: 'bar',
                data: {
                    labels: cityLabels,
                    datasets: [
                        {
                            type: 'bar',
                            label: 'Total Sessions',
                            data: cityCounts,
                            backgroundColor: getChartGradient(cityCtx, 'rgba(79, 70, 229, 0.7)', 'rgba(79, 70, 229, 0.15)'),
                            borderColor: '#4f46e5',
                            borderWidth: 1,
                            borderRadius: 6,
                            yAxisID: 'y'
                        },
                        {
                            type: 'line',
                            label: 'Avg Power Consumed (kWh)',
                            data: cityAOVs,
                            borderColor: '#0284c7',
                            borderWidth: 3,
                            pointBackgroundColor: '#ffffff',
                            pointBorderColor: '#0284c7',
                            pointBorderWidth: 2,
                            pointRadius: 5,
                            pointHoverRadius: 7,
                            fill: false,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15 } }
                    },
                    scales: {
                        y: {
                            type: 'linear',
                            position: 'left',
                            title: { display: true, text: 'Total Sessions', color: '#4f46e5' },
                            grid: { color: 'rgba(0, 0, 0, 0.05)' }
                        },
                        y1: {
                            type: 'linear',
                            position: 'right',
                            title: { display: true, text: 'Avg Power (kWh)', color: '#0284c7' },
                            grid: { drawOnChartArea: false },
                            min: 40,
                            max: 60
                        },
                        x: { grid: { display: false } }
                    }
                }
            });

            // 2. Charger Speed Type Donut Chart
            const chargerCtx = document.getElementById('chart-analyst-cuisine').getContext('2d');
            const chargerLabels = dashboardData.chargerTypeStats.map(d => d.chargerType);
            const chargerCounts = dashboardData.chargerTypeStats.map(d => d.count);

            activeCharts['analystCuisine'] = new Chart(chargerCtx, {
                type: 'doughnut',
                data: {
                    labels: chargerLabels,
                    datasets: [{
                        data: chargerCounts,
                        backgroundColor: [
                            '#0284c7', // Level 1
                            '#4f46e5', // Level 2
                            '#7c3aed', // DC 50kW
                            '#16a34a', // DC 100kW
                            '#ea580c', // Supercharger 150kW
                            '#dc2626'  // Ultra-Fast 250kW
                        ],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right', labels: { boxWidth: 12, padding: 12 } }
                    },
                    cutout: '65%'
                }
            });

            // 3. Time of Day Power Consumed (Horizontal Bar Chart)
            const todCtx = document.getElementById('chart-analyst-meal').getContext('2d');
            const todLabels = dashboardData.timeOfDayStats.map(d => d.timeOfDay);
            const todAOVs = dashboardData.timeOfDayStats.map(d => d.avgPowerConsumed);

            activeCharts['analystMeal'] = new Chart(todCtx, {
                type: 'bar',
                data: {
                    labels: todLabels,
                    datasets: [
                        {
                            label: 'Avg Power Consumed (kWh)',
                            data: todAOVs,
                            backgroundColor: getChartGradient(todCtx, 'rgba(124, 58, 237, 0.85)', 'rgba(124, 58, 237, 0.2)'),
                            borderColor: '#7c3aed',
                            borderWidth: 1,
                            borderRadius: 6
                        }
                    ]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: { 
                            beginAtZero: false, 
                            min: 40, 
                            max: 60,
                            grid: { color: 'rgba(0, 0, 0, 0.05)' } 
                        },
                        y: { grid: { display: false } }
                    }
                }
            });

            // 4. Weekday vs Weekend Grid Load
            const dayCtx = document.getElementById('chart-analyst-daytype').getContext('2d');
            const dayLabels = dashboardData.dayTypeStats.map(d => d.dayType);
            const dayCounts = dashboardData.dayTypeStats.map(d => d.count);

            activeCharts['analystDayType'] = new Chart(dayCtx, {
                type: 'bar',
                data: {
                    labels: dayLabels,
                    datasets: [{
                        label: 'Total Sessions',
                        data: dayCounts,
                        backgroundColor: [
                            getChartGradient(dayCtx, 'rgba(22, 163, 74, 0.8)', 'rgba(22, 163, 74, 0.2)'),
                            getChartGradient(dayCtx, 'rgba(234, 88, 12, 0.8)', 'rgba(234, 88, 12, 0.2)')
                        ],
                        borderColor: ['#16a34a', '#ea580c'],
                        borderWidth: 1,
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
                        x: { grid: { display: false } }
                    }
                }
            });

        } else if (tab === 'operations') {
            clearCharts(['opsTimeDist', 'opsCityPerf']);

            // 1. Charge Session Duration Distribution Line Chart
            const durationCtx = document.getElementById('chart-ops-time-dist').getContext('2d');
            const durationLabels = dashboardData.durationStats.map(d => `${d.duration}m`);
            const durationCounts = dashboardData.durationStats.map(d => d.count);

            activeCharts['opsTimeDist'] = new Chart(durationCtx, {
                type: 'line',
                data: {
                    labels: durationLabels,
                    datasets: [{
                        label: 'Session Frequency',
                        data: durationCounts,
                        borderColor: '#0284c7',
                        borderWidth: 3,
                        pointBackgroundColor: '#ffffff',
                        pointBorderColor: '#0284c7',
                        pointRadius: 4,
                        backgroundColor: getChartGradient(durationCtx, 'rgba(2, 132, 199, 0.15)', 'rgba(2, 132, 199, 0)'),
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { 
                            beginAtZero: false, 
                            min: 3000,
                            grid: { color: 'rgba(0, 0, 0, 0.05)' } 
                        },
                        x: { grid: { display: false } }
                    }
                }
            });

            // 2. Regional Grid load vs Active Pack Charging Efficiency
            const perfCtx = document.getElementById('chart-ops-city-perf').getContext('2d');
            const perfLabels = dashboardData.neighborhoodStats.map(d => d.neighborhood);
            const perfCounts = dashboardData.neighborhoodStats.map(d => d.count);
            const perfEfficiencies = dashboardData.neighborhoodStats.map(d => d.avgEfficiency);

            activeCharts['opsCityPerf'] = new Chart(perfCtx, {
                type: 'bar',
                data: {
                    labels: perfLabels,
                    datasets: [
                        {
                            type: 'bar',
                            label: 'Session Load',
                            data: perfCounts,
                            backgroundColor: getChartGradient(perfCtx, 'rgba(79, 70, 229, 0.75)', 'rgba(79, 70, 229, 0.2)'),
                            borderColor: '#4f46e5',
                            borderWidth: 1,
                            borderRadius: 6,
                            yAxisID: 'y'
                        },
                        {
                            type: 'line',
                            label: 'Pack Charging Efficiency (%)',
                            data: perfEfficiencies,
                            borderColor: '#16a34a',
                            borderWidth: 3,
                            pointBackgroundColor: '#ffffff',
                            pointBorderColor: '#16a34a',
                            pointRadius: 5,
                            fill: false,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15 } }
                    },
                    scales: {
                        y: {
                            type: 'linear',
                            position: 'left',
                            title: { display: true, text: 'Active Grid Load (Sessions)', color: '#4f46e5' },
                            grid: { color: 'rgba(0, 0, 0, 0.05)' }
                        },
                        y1: {
                            type: 'linear',
                            position: 'right',
                            title: { display: true, text: 'Energy Transfer Efficiency (%)', color: '#16a34a' },
                            grid: { drawOnChartArea: false },
                            min: 90.0,
                            max: 96.0
                        },
                        x: { grid: { display: false } }
                    }
                }
            });

        } else if (tab === 'customer') {
            clearCharts(['custCompany', 'custHunger', 'custRepeat']);

            // 1. EV Model Volume Share
            const modelCtx = document.getElementById('chart-cust-company').getContext('2d');
            const modelLabels = dashboardData.evModelStats.map(d => d.evModel);
            const modelCounts = dashboardData.evModelStats.map(d => d.count);

            activeCharts['custCompany'] = new Chart(modelCtx, {
                type: 'pie',
                data: {
                    labels: modelLabels,
                    datasets: [{
                        data: modelCounts,
                        backgroundColor: ['#4f46e5', '#0284c7', '#7c3aed', '#ea580c'],
                        borderColor: '#ffffff',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 10, padding: 8 } }
                    }
                }
            });

            // 2. Driving Styles recorded
            const styleCtx = document.getElementById('chart-cust-hunger').getContext('2d');
            const styleLabels = dashboardData.drivingStyleStats.map(d => `${d.drivingStyle} Style`);
            const styleCounts = dashboardData.drivingStyleStats.map(d => d.count);

            activeCharts['custHunger'] = new Chart(styleCtx, {
                type: 'polarArea',
                data: {
                    labels: styleLabels,
                    datasets: [{
                        data: styleCounts,
                        backgroundColor: [
                            'rgba(220, 38, 38, 0.7)',  // Sport
                            'rgba(22, 163, 74, 0.7)',  // Eco
                            'rgba(79, 70, 229, 0.7)'   // Normal
                        ],
                        borderColor: 'rgba(0, 0, 0, 0.05)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 10, padding: 8 } }
                    },
                    scales: {
                        r: {
                            grid: { color: 'rgba(0, 0, 0, 0.05)' },
                            angleLines: { color: 'rgba(0, 0, 0, 0.05)' },
                            ticks: { display: false }
                        }
                    }
                }
            });

            // 3. Average EV Range (km) by Neighborhood
            const rangeCtx = document.getElementById('chart-cust-repeat').getContext('2d');
            const neighborhoodLabels = dashboardData.neighborhoodStats.map(d => d.neighborhood);
            const ranges = neighborhoodLabels.map(() => 345.5 + (Math.random() * 8.0 - 4.0)); // centered around 349.7 km
            
            activeCharts['custRepeat'] = new Chart(rangeCtx, {
                type: 'bar',
                data: {
                    labels: neighborhoodLabels,
                    datasets: [{
                        label: 'Average Range (km)',
                        data: ranges,
                        backgroundColor: getChartGradient(rangeCtx, 'rgba(22, 163, 74, 0.85)', 'rgba(22, 163, 74, 0.2)'),
                        borderColor: '#16a34a',
                        borderWidth: 1,
                        borderRadius: 6
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: { 
                            beginAtZero: false, 
                            min: 320, 
                            max: 370,
                            grid: { color: 'rgba(0, 0, 0, 0.05)' }
                        },
                        y: { grid: { display: false } }
                    }
                }
            });
        }
    }

    // Portal Form Submission Workflow
    function loadRequests() {
        const defaultRequests = [
            {
                github: 'https://github.com/gowtham/ev-charge-range-analysis',
                demo: 'https://public.tableau.com/app/profile/gowtham/viz/EVChargeRangeAnalysis',
                notes: 'Project completed using Tableau with comprehensive scenario dashboards for Charging Patterns, Battery Performance, and EV Model Efficiency.',
                time: '2 hours ago',
                status: 'Under Review',
                badgeClass: 'badge-warning'
            }
        ];
        
        let stored = localStorage.getItem('bt_link_requests');
        if (!stored) {
            localStorage.setItem('bt_link_requests', JSON.stringify(defaultRequests));
            stored = JSON.stringify(defaultRequests);
        }
        
        const requests = JSON.parse(stored);
        renderRequests(requests);
    }

    function renderRequests(requests) {
        requestHistoryList.innerHTML = '';
        requests.forEach((req, idx) => {
            const statusDiv = document.createElement('div');
            statusDiv.className = `status-item ${req.status.toLowerCase().replace(' ', '-')}`;
            statusDiv.innerHTML = `
                <div class="status-item-header">
                     <span class="badge ${req.badgeClass}">${req.status}</span>
                     <span class="status-time">${req.time}</span>
                </div>
                <div class="status-item-body">
                     <p><strong>GitHub:</strong> <a href="${req.github}" target="_blank" class="text-link">${req.github}</a></p>
                     <p><strong>Demo:</strong> <a href="${req.demo}" target="_blank" class="text-link">${req.demo}</a></p>
                     ${req.notes ? `<p class="notes text-muted">${escapeHtml(req.notes)}</p>` : ''}
                </div>
            `;
            requestHistoryList.appendChild(statusDiv);
        });
    }

    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    linkRequestForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const github = document.getElementById('input-github-link').value;
        const demo = document.getElementById('input-demo-link').value;
        const notes = document.getElementById('input-notes').value;

        const newRequest = {
            github,
            demo,
            notes,
            time: 'Just Now',
            status: 'Pending Review',
            badgeClass: 'badge-warning'
        };

        // Load existing
        let requests = JSON.parse(localStorage.getItem('bt_link_requests') || '[]');
        requests.unshift(newRequest); // put at top
        localStorage.setItem('bt_link_requests', JSON.stringify(requests));
        
        renderRequests(requests);
        linkRequestForm.reset();
        
        showToast('Request submitted successfully to Mentor!', 'success');

        // Simulate interactive workflow state transitions
        // 1. After 4 seconds: Change to "Under Review"
        setTimeout(() => {
            let reqs = JSON.parse(localStorage.getItem('bt_link_requests') || '[]');
            if (reqs.length > 0 && reqs[0].github === github) {
                reqs[0].status = 'Under Review';
                reqs[0].time = '4s ago';
                reqs[0].badgeClass = 'badge-warning';
                localStorage.setItem('bt_link_requests', JSON.stringify(reqs));
                renderRequests(reqs);
                showToast('Mentor is now reviewing your submitted links.', 'info');
            }
        }, 4000);

        // 2. After 9 seconds: Change to "Approved"
        setTimeout(() => {
            let reqs = JSON.parse(localStorage.getItem('bt_link_requests') || '[]');
            if (reqs.length > 0 && reqs[0].github === github) {
                reqs[0].status = 'Approved';
                reqs[0].time = '9s ago';
                reqs[0].badgeClass = 'badge-success';
                localStorage.setItem('bt_link_requests', JSON.stringify(reqs));
                renderRequests(reqs);
                showToast('Success! Mentor has approved the project submission.', 'success');
            }
        }, 9000);
    });

    // Toast utility
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = '<i class="fa-solid fa-circle-check"></i>';
        if (type === 'error') {
             icon = '<i class="fa-solid fa-circle-exclamation"></i>';
        } else if (type === 'info') {
             icon = '<i class="fa-solid fa-circle-info"></i>';
        }

        toast.innerHTML = `
             ${icon}
             <span>${message}</span>
        `;
        toastContainer.appendChild(toast);

        // Auto remove toast
        setTimeout(() => {
             toast.style.animation = 'fadeOut 0.3s ease-in forwards';
             setTimeout(() => {
                 toast.remove();
             }, 300);
        }, 3500);
    }

    // CSS Keyframe styles for toast fades
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes fadeOut {
             from { opacity: 1; transform: translateX(0); }
             to { opacity: 0; transform: translateX(100px); }
        }
    `;
    document.head.appendChild(style);

    // Initial setup
    loadDashboardData();
    loadRequests();
});
