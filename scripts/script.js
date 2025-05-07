// DOM Elements
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('csvFileInput');
const processCSVBtn = document.getElementById('processCSVBtn');
const fileInfo = document.getElementById('fileInfo');
const historyModal = document.getElementById('historyModal');
const loadingOverlay = document.getElementById('loadingOverlay');
const progressBar = document.getElementById('progressBar');
const currentProgress = document.getElementById('currentProgress');
const totalItems = document.getElementById('totalItems');
const batchProgress = document.getElementById('batchProgress');
const resultsArea = document.getElementById('results');
const singleResult = document.getElementById('singleResult');
const saveCredentialsCheckbox = document.getElementById('saveCredentials');

// Initialize application
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    // Setup event listeners
    setupDragAndDrop();
    setupFileInput();
    setupModal();
    loadSavedCredentials();

    // Download CSV template
    document.getElementById('downloadTemplate').addEventListener('click', downloadTemplate);

    // Show history
    document.getElementById('showHistory').addEventListener('click', (e) => {
        e.preventDefault();
        showHistory();
    });
}

// Drag and drop functionality
function setupDragAndDrop() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    dropArea.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    dropArea.classList.add('highlight');
}

function unhighlight() {
    dropArea.classList.remove('highlight');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const file = dt.files[0];
    handleFile(file);
}

// File input handling
function setupFileInput() {
    fileInput.addEventListener('change', (e) => {
        handleFile(e.target.files[0]);
    });
}

function handleFile(file) {
    if (file && file.type === 'text/csv') {
        fileInfo.classList.remove('hidden');
        fileInfo.innerHTML = `
            <i class="fas fa-file-csv"></i> 
            <span>${file.name}</span> 
            <small>(${formatFileSize(file.size)})</small>
            <button class="remove-file" onclick="removeFile()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Enable process button
        processCSVBtn.classList.remove('disabled');
        processCSVBtn.disabled = false;
        processCSVBtn.addEventListener('click', () => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const contents = e.target.result;
                processCSV(contents);
            };
            reader.readAsText(file);
        });
    } else {
        showNotification('Please select a valid CSV file', 'error');
    }
}

function removeFile() {
    fileInput.value = '';
    fileInfo.classList.add('hidden');
    processCSVBtn.classList.add('disabled');
    processCSVBtn.disabled = true;
    processCSVBtn.removeEventListener('click', processCSV);
}

// Modal functionality
function setupModal() {
    const closeBtn = document.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        historyModal.classList.add('hidden');
    });

    window.addEventListener('click', (e) => {
        if (e.target === historyModal) {
            historyModal.classList.add('hidden');
        }
    });
}

// Process single invoice
function processSingleInvoice() {
    const billerGUID = document.getElementById('billerGUID').value;
    const webServiceKey = document.getElementById('webServiceKey').value;
    const invoiceNumber = document.getElementById('invoiceNumber').value;

    if (!billerGUID || !webServiceKey || !invoiceNumber) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    if (!validateGUID(billerGUID) || !validateGUID(webServiceKey)) {
        showNotification('Please enter valid GUIDs', 'error');
        return;
    }

    // Save credentials if checked
    if (saveCredentialsCheckbox.checked) {
        saveCredentials(billerGUID, webServiceKey);
    }

    showLoading();
    callWebService(billerGUID, webServiceKey, invoiceNumber, (result) => {
        hideLoading();
        displaySingleResult(result);
        saveToHistory(result);
    });
}

// Process CSV file
function processCSV(csv) {
    const lines = csv.split('\n').filter(line => line.trim() !== '');

    if (lines.length === 0) {
        showNotification('CSV file is empty', 'error');
        return;
    }

    // Setup progress tracking
    const totalCount = lines.length;
    let processedCount = 0;
    const results = [];

    // Show progress UI
    batchProgress.classList.remove('hidden');
    totalItems.textContent = totalCount;
    currentProgress.textContent = processedCount;
    progressBar.style.width = '0%';

    showLoading();

    // Process each line
    lines.forEach((line, index) => {
        const [billerGUID, webServiceKey, invoiceNumber] = line.split(',').map(item => item.trim());

        if (validateGUID(billerGUID) && validateGUID(webServiceKey) && invoiceNumber) {
            setTimeout(() => {
                callWebService(billerGUID, webServiceKey, invoiceNumber, (result) => {
                    results.push(result);
                    processedCount++;

                    // Update progress
                    currentProgress.textContent = processedCount;
                    const progressPercentage = (processedCount / totalCount) * 100;
                    progressBar.style.width = `${progressPercentage}%`;

                    // Check if all processing is complete
                    if (processedCount === totalCount) {
                        hideLoading();
                        displayBatchResults(results);
                        saveToHistory(results, true);
                        downloadCSV(results);
                    }
                });
            }, index * 300); // Stagger requests to avoid overwhelming the server
        } else {
            results.push({
                invoiceNumber: invoiceNumber || 'Invalid',
                success: 'false',
                balanceDue: '0.00',
                error: 'Invalid input data'
            });

            processedCount++;
            currentProgress.textContent = processedCount;
            const progressPercentage = (processedCount / totalCount) * 100;
            progressBar.style.width = `${progressPercentage}%`;

            if (processedCount === totalCount) {
                hideLoading();
                displayBatchResults(results);
                saveToHistory(results, true);
                downloadCSV(results);
            }
        }
    });
}

// Web service call
// Web service call
// Web service call
// Web service call - simplified for direct access
// Web service call - direct implementation without simulation fallbacks
function callWebService(billerGUID, webServiceKey, invoiceNumber, callback) {
    // Create the SOAP envelope with precise formatting
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ViewInvoiceByInvoiceNumber xmlns="https://www.invoicecloud.com/portal/webservices/CloudInvoicing/">
      <Req>
        <BillerGUID>${billerGUID}</BillerGUID>
        <WebServiceKey>${webServiceKey}</WebServiceKey>
        <InvoiceNumber>${invoiceNumber}</InvoiceNumber>
      </Req>
    </ViewInvoiceByInvoiceNumber>
  </soap:Body>
</soap:Envelope>`;

    // Check if we're running in a development environment
    const isLocalhost = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '';

    // For local development, we can use a CORS proxy if needed
    const apiUrl = isLocalhost ?
        'https://corsproxy.io/?https://www.invoicecloud.com/portal/webservices/CloudInvoicing.asmx' :
        'https://www.invoicecloud.com/portal/webservices/CloudInvoicing.asmx';

    // Make the SOAP request
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'https://www.invoicecloud.com/portal/webservices/CloudInvoicing/ViewInvoiceByInvoiceNumber',
        },
        body: soapRequest
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server returned: ${response.status} ${response.statusText}`);
            }
            return response.text();
        })
        .then(xmlString => {
            // Parse the XML response
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

            // Extract the response data
            const success = xmlDoc.getElementsByTagName('Success')[0]?.textContent || 'false';
            const balanceDue = xmlDoc.getElementsByTagName('BalanceDue')[0]?.textContent || '0.00';
            const errorMessage = xmlDoc.getElementsByTagName('ErrorMessage')[0]?.textContent || '';

            // Create the result object
            const result = {
                invoiceNumber,
                success,
                balanceDue,
                error: errorMessage,
                timestamp: new Date().toISOString()
            };

            // Return the result to the callback
            callback(result);
        })
        .catch(error => {
            console.error('SOAP Request Error:', error);

            if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
                // CORS specific error - provide a clear message
                showNotification(
                    'Cross-Origin Request Blocked: This application must be hosted on a server that can access the invoice service. ' +
                    'Contact your system administrator to configure proper access.',
                    'error'
                );
            }

            // Return error to callback
            const result = {
                invoiceNumber,
                success: 'false',
                balanceDue: '0.00',
                error: `API connection failed: ${error.message}`,
                timestamp: new Date().toISOString()
            };

            callback(result);
        });
}





// Display functions
function displaySingleResult(result) {
    singleResult.classList.remove('hidden');

    const isSuccess = result.success === 'true';
    const statusClass = isSuccess ? 'success-badge' : 'error-badge';
    const statusText = isSuccess ? 'Success' : 'Failed';

    singleResult.innerHTML = `
        <div class="result-item ${isSuccess ? 'result-success' : 'result-error'}">
            <div class="result-header">
                <span class="result-title">Invoice #${result.invoiceNumber}</span>
                <span class="${statusClass}">${statusText}</span>
            </div>
            <div class="result-details">
                <p>Status: ${isSuccess ? 'Successfully processed' : 'Processing failed'}</p>
                ${isSuccess ? `<p class="balance-amount">Balance Due: $${formatCurrency(result.balanceDue)}</p>` : ''}
                ${result.error ? `<p class="error-message">Error: ${result.error}</p>` : ''}
                <p class="timestamp">Processed: ${formatDate(result.timestamp)}</p>
            </div>
        </div>
    `;
}

function displayBatchResults(results) {
    resultsArea.classList.remove('hidden');

    const successCount = results.filter(r => r.success === 'true').length;
    const failureCount = results.length - successCount;

    let html = `
        <h3>Processing Results</h3>
        <div class="summary">
            <p><strong>Total Processed:</strong> ${results.length}</p>
            <p><strong>Successful:</strong> ${successCount}</p>
            <p><strong>Failed:</strong> ${failureCount}</p>
        </div>
        <div class="results-list">
    `;

    // Show up to 5 results
    const displayLimit = Math.min(results.length, 5);
    for (let i = 0; i < displayLimit; i++) {
        const result = results[i];
        const isSuccess = result.success === 'true';
        const statusClass = isSuccess ? 'success-badge' : 'error-badge';
        const statusText = isSuccess ? 'Success' : 'Failed';

        html += `
            <div class="result-item ${isSuccess ? 'result-success' : 'result-error'}">
                <div class="result-header">
                    <span class="result-title">Invoice #${result.invoiceNumber}</span>
                    <span class="${statusClass}">${statusText}</span>
                </div>
                <div class="result-details">
                    ${isSuccess ? `<p class="balance-amount">Balance Due: $${formatCurrency(result.balanceDue)}</p>` : ''}
                    ${result.error ? `<p class="error-message">Error: ${result.error}</p>` : ''}
                </div>
            </div>
        `;
    }

    if (results.length > 5) {
        html += `<p class="more-results">+ ${results.length - 5} more results (see downloaded CSV)</p>`;
    }

    html += `</div>`;
    resultsArea.innerHTML = html;
}

// Download functions
function downloadCSV(results) {
    let csvContent = "data:text/csv;charset=utf-8,Invoice Number,Success,Balance Due,Error Message,Timestamp\n";

    results.forEach(result => {
        const row = [
            `"${result.invoiceNumber}"`,
            result.success,
            result.balanceDue,
            result.error ? `"${result.error}"` : '',
            result.timestamp
        ].join(',');
        csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `invoice_results_${formatDateForFilename(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function downloadTemplate(e) {
    e.preventDefault();

    const templateContent = "data:text/csv;charset=utf-8,BillerGUID,WebServiceKey,InvoiceNumber\n" +
        "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx,xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx,INV12345\n" +
        "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx,xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx,INV67890";

    const encodedUri = encodeURI(templateContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "invoice_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Credential management
function saveCredentials(billerGUID, webServiceKey) {
    localStorage.setItem('billerGUID', billerGUID);
    localStorage.setItem('webServiceKey', webServiceKey);
}

function loadSavedCredentials() {
    const billerGUID = localStorage.getItem('billerGUID');
    const webServiceKey = localStorage.getItem('webServiceKey');

    if (billerGUID) {
        document.getElementById('billerGUID').value = billerGUID;
    }

    if (webServiceKey) {
        document.getElementById('webServiceKey').value = webServiceKey;
    }
}

// History management
function saveToHistory(data, isBatch = false) {
    const history = JSON.parse(localStorage.getItem('invoiceHistory') || '[]');

    if (isBatch) {
        // For batch processing, save summary
        history.push({
            type: 'batch',
            count: data.length,
            successCount: data.filter(r => r.success === 'true').length,
            failureCount: data.filter(r => r.success !== 'true').length,
            timestamp: new Date().toISOString(),
            sample: data.slice(0, 3) // Save first 3 as samples
        });
    } else {
        // For single invoice
        history.push({
            type: 'single',
            data: data,
            timestamp: new Date().toISOString()
        });
    }

    // Keep only last 50 history items
    if (history.length > 50) {
        history.shift();
    }

    localStorage.setItem('invoiceHistory', JSON.stringify(history));
}

function showHistory() {
    const history = JSON.parse(localStorage.getItem('invoiceHistory') || '[]');
    const historyContent = document.getElementById('historyContent');

    if (history.length === 0) {
        historyContent.innerHTML = '<p>No processing history available</p>';
    } else {
        let html = '<div class="history-items">';

        history.reverse().forEach((item, index) => {
            if (item.type === 'batch') {
                html += `
                    <div class="history-item">
                        <div class="history-header">
                            <h3>Batch Processing</h3>
                            <span>${formatDate(item.timestamp)}</span>
                        </div>
                        <div class="history-details">
                            <p>Processed ${item.count} invoices</p>
                            <p>Success: ${item.successCount}, Failed: ${item.failureCount}</p>
                            ${item.sample.length > 0 ? '<p>Sample invoices:</p>' : ''}
                            ${item.sample.map(sample => `<div class="sample-invoice">Invoice #${sample.invoiceNumber}: ${sample.success === 'true' ? `$${formatCurrency(sample.balanceDue)}` : 'Failed'}</div>`).join('')}
                        </div>
                    </div>
                `;
            } else {
                const data = item.data;
                const isSuccess = data.success === 'true';

                html += `
                    <div class="history-item">
                        <div class="history-header">
                            <h3>Single Invoice #${data.invoiceNumber}</h3>
                            <span>${formatDate(item.timestamp)}</span>
                        </div>
                        <div class="history-details">
                            <p>Status: ${isSuccess ? 'Success' : 'Failed'}</p>
                            ${isSuccess ? `<p>Balance Due: $${formatCurrency(data.balanceDue)}</p>` : ''}
                            ${data.error ? `<p>Error: ${data.error}</p>` : ''}
                        </div>
                    </div>
                `;
            }
        });

        html += '</div>';
        historyContent.innerHTML = html;
    }

    historyModal.classList.remove('hidden');
}

// Utility functions
function validateGUID(guid) {
    const guidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return guidPattern.test(guid);
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
}

function formatCurrency(value) {
    return parseFloat(value).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

function formatDateForFilename(date) {
    return date.toISOString().replace(/[:T\-\.Z]/g, '').substring(0, 14);
}

function showLoading() {
    loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">×</button>
    `;

    // Add to body
    document.body.appendChild(notification);

    // Add show class after a small delay (for animation)
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Setup close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    });

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}
