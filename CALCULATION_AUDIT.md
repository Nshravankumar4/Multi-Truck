# Authoritative Financial Calculation Audit
## Transport Brokerage Ledger Pvt Ltd (SR Transport)
**Master Workbooks:**  
- `Y/Truck_Detials_1122_6666_P and L Account.xlsx`
- `X/Truck_Detials_1122_6666_Drivers.xlsx`

---

## 1. P&L Financial Architecture

### 1.1 Gross Freight Revenue ($P_1$)
$$P_1 = \sum \text{Trip Freight Revenue}$$

For each trip record:
- **`pnlFreight`**: Total contracted freight charged to client/transporter.
- **`baseFreight`**: The base freight eligible for driver salary commission (excludes client deductions or specific surcharges).
- **`advanceReceived`**: Freight advance paid by client/transporter directly.
- **`balanceDue`**: Calculated as $\text{balanceDue} = \text{pnlFreight} - \text{advanceReceived}$.

#### October 2026 Audit:
- **TG15T6666:** 4 Trips: ₹1,75,000 + ₹1,08,500 + ₹72,300 + ₹27,000 = **₹3,82,800** (Formula `=SUM(E11:E14)`)
- **TS15UE1122:** 3 Trips: ₹15,000 + ₹1,41,000 + ₹80,000 = **₹2,36,000** (Formula `=SUM(L11:L13)`)
- **Combined Fleet:** ₹3,82,800 + ₹2,36,000 = **₹6,18,800** (7 Trips)

---

### 1.2 Operating Expenses ($P_2$)
$$P_2 = \text{Diesel} + \text{FastTag} + \text{AddBlue \& Misc} + \text{En-route Road Expenses} + \text{Driver 12\% Commission}$$

#### Component Breakdown:
1. **Diesel Fuel:** Sum of itemized fuel slips for the truck in the period.
   - TG15T6666: ₹30,500 + ₹30,500 + ₹31,600 + ₹13,000 + ₹27,000 = **₹1,32,600** (5 slips)
   - TS15UE1122: ₹24,000 + ₹19,000 + ₹23,000 + ₹10,000 + ₹27,000 = **₹1,03,000** (5 slips)
   - Combined: **₹2,35,600** (10 slips)
2. **FastTag Tolls:**
   - TG15T6666: **₹40,000**
   - TS15UE1122: **₹25,000**
   - Combined: **₹65,000**
3. **AddBlue & Maintenance:**
   - TG15T6666: **₹15,000**
   - TS15UE1122: **₹20,000**
   - Combined: **₹35,000**
4. **Road Expenses (En-route):**
   - TG15T6666: **₹28,735** (37 receipts)
   - TS15UE1122: **₹11,790** (22 receipts)
   - Combined: **₹40,525** (59 receipts)
5. **Driver Salary Commission (12%):**
   $$\text{Commission} = \text{ROUND}\left(\sum \text{Eligible Base Freight} \times 0.12, 0\right)$$
   - TG15T6666 Base Freight: ₹1,40,000 + ₹1,08,500 + ₹64,000 + ₹27,000 = ₹3,39,500  
     $\text{Commission} = 339500 \times 0.12 = \mathbf{₹40,740}$
   - TS15UE1122 Base Freight: ₹10,000 + ₹1,14,000 + ₹75,000 = ₹1,99,000  
     $\text{Commission} = 199000 \times 0.12 = \mathbf{₹23,880}$
   - Combined Commissions: **₹64,620**

#### Operating Expenses ($P_2$) Totals:
- **TG15T6666:** ₹1,32,600 + ₹40,000 + ₹15,000 + ₹28,735 + ₹40,740 = **₹2,57,075**
- **TS15UE1122:** ₹1,03,000 + ₹25,000 + ₹20,000 + ₹11,790 + ₹23,880 = **₹1,83,670**
- **Combined Fleet:** ₹2,57,075 + ₹1,83,670 = **₹4,40,745**

---

### 1.3 Net Operating Profit & Margin
$$\text{Net Profit} = P_1 - P_2$$
$$\text{Margin \%} = \frac{\text{Net Profit}}{P_1} \times 100$$

- **TG15T6666:** ₹3,82,800 - ₹2,57,075 = **₹1,25,725** (Margin: **32.84%**)
- **TS15UE1122:** ₹2,36,000 - ₹1,83,670 = **₹52,330** (Margin: **22.17%**)
- **Combined Fleet:** ₹6,18,800 - ₹4,40,745 = **₹1,78,055** (Margin: **28.77%**)

---

## 2. Driver Settlement Architecture

### 2.1 General Mathematical Formulation (Multi-Truck Dynamic Engine)
For any driver/truck, settlements balance **Credits** (what the company owes the driver) against **Debits** (what the driver owes the company):

$$\text{Credits} = \text{Commission (12\%)} + \text{Reimbursable Road Expenses} + \text{Prior Credit Balance Due to Driver}$$
$$\text{Debits} = \text{Advances Taken} + \text{Prior Debit Balance Owed by Driver}$$
$$\text{Net Settlement} = \text{Credits} - \text{Debits}$$

- If $\text{Net Settlement} > 0$: Company pays Driver (**PAYABLE_TO_DRIVER**).
- If $\text{Net Settlement} < 0$: Driver pays Company (**PAYABLE_BY_DRIVER** / Receivable).
- If $\text{Net Settlement} = 0$: Balanced.

---

### 2.2 Vehicle 1: TG15T6666 (Driver: Noor Allam)
- **Credits:**
  - 12% Commission: **₹40,740**
  - Claimed Road Expenses: **₹28,700** *(Itemized receipt sum: ₹28,735; difference: ₹35)*
  - Prior Balance Due from Company: **₹13,800**
  - Total Credits: $40740 + 28700 + 13800 = \mathbf{₹83,240}$
- **Debits:**
  - 10 Advances (Cash, UPI, Bank Transfer): **₹78,200**
- **Net Balance:**
  $$\text{Net} = ₹83,240 - ₹78,200 = \mathbf{+₹5,040}$$
  **Direction:** Transporter Shankar pays Driver Noor Allam **₹5,040**.

---

### 2.3 Vehicle 2: TS15UE1122 (Driver: Allam Brother)
- **Credits:**
  - 12% Commission: **₹23,880**
  - Road Expenses: **₹11,790**
  - Total Credits: $23880 + 11790 = \mathbf{₹35,670}$
- **Debits:**
  - 6 Advances: **₹41,500**
- **Current Period Subtotal:**
  $$\text{Period Deficit} = ₹41,500 - ₹35,670 = \mathbf{₹5,830} \text{ (Driver took excess advance)}$$
- **Prior Balance Owed to Company:**
  $$\text{Old Balance} = \mathbf{₹62,340}$$
- **Total Net Balance Owed by Driver:**
  $$\text{Net} = ₹62,340 + ₹5,830 = \mathbf{₹68,170}$$
  **Direction:** Driver Allam Brother pays Transporter Shankar **₹68,170**.

