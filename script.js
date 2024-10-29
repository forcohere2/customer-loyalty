function getCreditExpiryDate() {
    let expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 6); // Credits expire in 6 months
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
    let isNewCreditEarned = false;

    if (lastPurchaseDate && lastPurchaseDate === date) {
        newCredit = 0;
        usableCredit = 0;
    } else {
        isNewCreditEarned = true;
        newCredit = amount * 0.10;
        usableCredit = Math.min(totalCredit * 0.05, amount * 0.05);
    }

    return { newCredit, usableCredit, isNewCreditEarned };
}

function calculateTotalCredit(purchases) {
    let totalCredit = 0;
    const currentDate = new Date().toISOString().split('T')[0];
    purchases.forEach(purchase => {
        if (purchase.expiryDate > currentDate) {
            totalCredit += purchase.newCredit;
        }
    });
    return totalCredit;
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
    const totalCredit = calculateTotalCredit(purchases);

    const { newCredit, usableCredit, isNewCreditEarned } = calculateCredit(amount, totalCredit, date, lastPurchaseDate);
    const finalPrice = amount - usableCredit;
    const updatedTotalCredit = totalCredit - usableCredit + newCredit;
    const expiryDate = getCreditExpiryDate();

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

    document.getElementById("phone").value = "";
    document.getElementById("date").value = "";
    document.getElementById("amount").value = "";
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
        const row = `
            <tr>
                <td>${index + 1}</td>
                <td>${purchase.date}</td>
                <td>${purchase.amount.toFixed(2)}</td>
                <td>${purchase.usableCredit.toFixed(2)}</td>
                <td>${purchase.finalPrice.toFixed(2)}</td>
                <td>${purchase.newCredit.toFixed(2)}</td>
                <td>${purchase.totalCredit.toFixed(2)}</td>
                <td>${purchase.expiryDate}</td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });
}

document.getElementById("phone").addEventListener("input", function () {
    const phone = this.value.trim();
    if (phone) {
        displayPurchases(phone);
    } else {
        document.getElementById("purchase-table").innerHTML = '';
        document.getElementById("no-history-message").style.display = "block";
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const phoneNumbers = Object.keys(localStorage);

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
});
