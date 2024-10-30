function getCreditExpiryDate(purchaseDate) {
    let expiryDate = new Date(purchaseDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    return expiryDate.toISOString().split('T')[0];
}

function getPurchases(phone) {
    return JSON.parse(localStorage.getItem(phone)) || [];
}

function savePurchases(phone, purchases) {
    localStorage.setItem(phone, JSON.stringify(purchases));
}

function calculateCredit(amount, totalCredit, date, lastPurchaseDate) {
    let newCredit = 0;
    let usableCredit = 0;
    let isNewCreditEarned = true;

    if (lastPurchaseDate && lastPurchaseDate === date) {
        usableCredit = 0;  // Can't use any credit on same-day purchases
        const finalPrice = amount - usableCredit;
        newCredit = finalPrice * 0.10;  // 10% of final price
    } else {
        usableCredit = Math.min(totalCredit, amount * 0.05);
        const finalPrice = amount - usableCredit;
        newCredit = finalPrice * 0.10;  // 10% of final price
    }

    return { newCredit, usableCredit, isNewCreditEarned };
}

function searchUser() {
    const phone = document.getElementById("phone").value.trim();

    if (!phone) {
        alert("Please enter a phone number.");
        return;
    }

    displayPurchases(phone);
}

function addPurchase() {
    const phone = document.getElementById("phone").value.trim();
    const date = document.getElementById("date").value;
    const amount = parseFloat(document.getElementById("amount").value);

    if (!phone || !date || isNaN(amount)) {
        alert("Please enter all fields correctly.");
        return;
    }

    const purchases = getPurchases(phone);
    const lastPurchase = purchases.length ? purchases[purchases.length - 1] : null;
    const lastPurchaseDate = lastPurchase ? lastPurchase.date : null;
    
    const currentTotalCredit = lastPurchase ? lastPurchase.totalCredit : 0;

    const { newCredit, usableCredit, isNewCreditEarned } = calculateCredit(amount, currentTotalCredit, date, lastPurchaseDate);
    
    let updatedTotalCredit = isNewCreditEarned 
        ? currentTotalCredit - usableCredit + newCredit 
        : currentTotalCredit;

    const finalPrice = amount - usableCredit;

    // Only set expiry date if new credit is earned
    const expiryDate = newCredit > 0 ? getCreditExpiryDate(date) : "-";

    const purchase = {
        date,
        amount,
        usableCredit: isNewCreditEarned ? usableCredit : 0,
        finalPrice: isNewCreditEarned ? finalPrice : amount,
        newCredit: isNewCreditEarned ? newCredit : 0,
        totalCredit: updatedTotalCredit,
        expiryDate
    };

    purchases.push(purchase);
    savePurchases(phone, purchases);
    displayPurchases(phone);

    localStorage.setItem("tempPhone", phone);
    localStorage.setItem("tempDate", date);
    localStorage.setItem("tempAmount", amount);

    location.reload();
}

function displayPurchases(phone) {
    const purchases = getPurchases(phone);
    const tableBody = document.getElementById("purchase-table");
    const noHistoryMessage = document.getElementById("no-history-message");

    if (purchases.length === 0) {
        noHistoryMessage.style.display = "block";
        tableBody.innerHTML = '';
        return;
    } else {
        noHistoryMessage.style.display = "none";
    }

    tableBody.innerHTML = '';
    purchases.forEach((purchase, index) => {
        const [year, month, day] = purchase.date.split('-');
        const formattedDate = `${day}-${month}-${year}`;
        
        const formattedExpiryDate = purchase.expiryDate !== "-" 
            ? `${purchase.expiryDate.split('-').reverse().join('-')}`
            : "-";

        const row = `
            <tr>
                <td>${index + 1}</td>
                <td>${formattedDate}</td>
                <td>${purchase.amount.toFixed(2)}</td>
                <td>${purchase.usableCredit.toFixed(2)}</td>
                <td>${purchase.finalPrice.toFixed(2)}</td>
                <td>${purchase.newCredit.toFixed(2)}</td>
                <td>${purchase.totalCredit.toFixed(2)}</td>
                <td>${formattedExpiryDate}</td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });

    if (window.dataTableInstance) {
        window.dataTableInstance.destroy();
    }
    window.dataTableInstance = new DataTable("#purchaseTable", {
        searchable: true,
        sortable: true,
        fixedHeight: true
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const phoneNumbers = Object.keys(localStorage);
    const phone = localStorage.getItem("tempPhone");
    const date = localStorage.getItem("tempDate");
    const amount = localStorage.getItem("tempAmount");

    if (phone) document.getElementById("phone").value = phone;
    if (date) document.getElementById("date").value = date;
    if (amount) document.getElementById("amount").value = amount;

    localStorage.removeItem("tempPhone");
    localStorage.removeItem("tempDate");
    localStorage.removeItem("tempAmount");

    const autoCompleteJS = new autoComplete({
        placeHolder: "Enter phone number...",
        data: {
            src: phoneNumbers,
            cache: false,
        },
        selector: "#phone",
        resultItem: {
            highlight: true,
        },
        events: {
            input: {
                selection: (event) => {
                    const selection = event.detail.selection.value;
                    document.getElementById("phone").value = selection;
                    displayPurchases(selection);
                }
            }
        }
    });

    if (phone) {
        displayPurchases(phone);
    }
});