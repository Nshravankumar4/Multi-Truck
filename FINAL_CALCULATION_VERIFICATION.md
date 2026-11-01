# SR Transport — Final Calculation & Accounting Verification
**Reference Workbooks:** `X/Truck_Detials_1122_6666_Drivers.xlsx` & `Y/Truck_Detials_1122_6666_P and L Account.xlsx`  
**Accounting Period:** October 2026 (Baseline Audit Period)  
**Verification Status:** 100% Mathematical Parity Achieved

---

## 1. Accounting Formula Architecture

### 1.1 Revenue ($P_1$)
$$P_1 = \sum \text{Trip Freight Revenue}$$
Base Freight is tracked separately for commission calculations:
$$\text{Base Freight} = \sum \text{Trip Base Freight}$$

### 1.2 Operating Expenses ($P_2$)
$$P_2 = \text{Diesel} + \text{FastTag} + \text{AddBlue/Misc} + \text{Itemized Road Expenses} + \text{Driver Commission}$$

### 1.3 Driver Commission (12%)
$$\text{Driver Commission} = \text{ROUND}(\text{Total Base Freight} \times 0.12, 0)$$

### 1.4 Net Profit & Margin
$$\text{Net Profit} = P_1 - P_2$$
$$\text{Profit Margin} = \left(\frac{\text{Net Profit}}{P_1}\right) \times 100$$

---

## 2. Truck-Wise Financial Reconciliation (October 2026)

### 2.1 Vehicle TG15T6666 (Driver: Noor Allam)

#### Trips Ledger (4 Shipments)
| Trip ID | Date | Origin | Destination | $P_1$ Freight | Base Freight | Diesel | Road Exp |
|---|---|---|---|---|---|---|---|
| TRP-66-1 | 2026-10-02 | MDCL | MADHAPURA | ₹1,75,000 | ₹1,40,000 | ₹62,000 | ₹13,500 |
| TRP-66-2 | 2026-10-09 | AURANGABAD | HYD | ₹1,08,500 | ₹1,08,500 | ₹38,000 | ₹8,200 |
| TRP-66-3 | 2026-10-15 | K'NAG | KURNOOL | ₹72,300 | ₹64,000 | ₹18,000 | ₹4,500 |
| TRP-66-4 | 2026-10-18 | KURNOOL | MDCL | ₹27,000 | ₹27,000 | ₹14,600 | ₹2,500 |
| **Total** | | | | **₹3,82,800** | **₹3,39,500** | **₹1,32,600** | **₹28,700** |

#### Expenses Breakdown ($P_2$)
- **Diesel (5 fuelings):** ₹30,500 + ₹30,500 + ₹31,600 + ₹13,000 + ₹27,000 = **₹1,32,600**
- **FastTag Toll:** **₹40,000**
- **AddBlue & Maintenance:** **₹15,000**
- **Itemized Road Expenses (37 vouchers):** **₹28,735**
- **Driver Commission:** $\text{ROUND}(3,39,500 \times 0.12) = \mathbf{₹40,740}$
- **Total Operating Expenses ($P_2$):** $1,32,600 + 40,000 + 15,000 + 28,735 + 40,740 = \mathbf{₹2,57,075}$
- **Net Profit:** $3,82,800 - 2,57,075 = \mathbf{₹1,25,725}$
- **Net Margin:** $(1,25,725 / 3,82,800) \times 100 = \mathbf{32.84\%}$

#### Noor Allam Settlement Reconciliation
- **Credits to Driver:**
  - 12% Salary Commission: ₹40,740
  - Claimed Road Expenses: ₹28,700
  - Previous Month Balance (Due to Driver): ₹13,800
  - **Total Driver Credits:** ₹83,240
- **Debits (10 Advances Paid):**
  - ₹5,000 + ₹6,000 + ₹2,000 + ₹3,000 + ₹7,000 + ₹3,000 + ₹2,000 + ₹10,000 + ₹5,000 + ₹35,200 = **₹78,200**
- **Net Settlement Balance:** $83,240 - 78,200 = \mathbf{₹5,040}$ **Payable to Driver (Shankar pays Noor Allam)**
- **Road Expense Audit Difference:** $|28,735 - 28,700| = \mathbf{₹35}$ (Preserved and audited).

---

### 2.2 Vehicle TS15UE1122 (Driver: Allam Brother)

#### Trips Ledger (3 Shipments)
| Trip ID | Date | Origin | Destination | $P_1$ Freight | Base Freight | Diesel | Road Exp |
|---|---|---|---|---|---|---|---|
| TRP-11-1 | 2026-10-04 | MDCL | CHEGUNTA | ₹15,000 | ₹10,000 | ₹24,000 | ₹2,500 |
| TRP-11-2 | 2026-10-06 | MDCL | MUZZFARPUR | ₹1,41,000 | ₹1,14,000 | ₹42,000 | ₹5,290 |
| TRP-11-3 | 2026-10-11 | JABALPUR | BHONIGIRI | ₹80,000 | ₹75,000 | ₹37,000 | ₹4,000 |
| **Total** | | | | **₹2,36,000** | **₹1,99,000** | **₹1,03,000** | **₹11,790** |

#### Expenses Breakdown ($P_2$)
- **Diesel (5 fuelings):** ₹24,000 + ₹19,000 + ₹23,000 + ₹10,000 + ₹27,000 = **₹1,03,000**
- **FastTag Toll:** **₹25,000**
- **AddBlue & Maintenance:** **₹20,000**
- **Road Expenses (22 vouchers):** **₹11,790**
- **Driver Commission:** $\text{ROUND}(1,99,000 \times 0.12) = \mathbf{₹23,880}$
- **Total Operating Expenses ($P_2$):** $1,03,000 + 25,000 + 20,000 + 11,790 + 23,880 = \mathbf{₹1,83,670}$
- **Net Profit:** $2,36,000 - 1,83,670 = \mathbf{₹52,330}$
- **Net Margin:** $(52,330 / 2,36,000) \times 100 = \mathbf{22.17\%}$

#### Allam Brother Settlement Reconciliation
- **Credits:** Commission (₹23,880) + Road Expenses (₹11,790) = **₹35,670**
- **Debits (6 Advances Paid):** ₹2,500 + ₹5,000 + ₹5,000 + ₹20,000 + ₹5,000 + ₹4,000 = **₹41,500**
- **Current Period Net Deficit:** $41,500 - 35,670 = \mathbf{₹5,830}$
- **Prior Month Balance (Owed by Driver):** **₹62,340**
- **Total Balance Payable by Driver:** $62,340 + 5,830 = \mathbf{₹68,170}$ **Payable by Driver (Allam Brother pays Shankar)**

---

### 2.3 Fleet Combined Grand Totals

| Accounting Metric | TG15T6666 | TS15UE1122 | Fleet Combined | Verified Parity |
|---|---|---|---|---|
| Total Trips | 4 | 3 | **7** | **MATCH (100%)** |
| Total Revenue ($P_1$) | ₹3,82,800 | ₹2,36,000 | **₹6,18,800** | **MATCH (100%)** |
| Total Diesel | ₹1,32,600 | ₹1,03,000 | **₹2,35,600** | **MATCH (100%)** |
| FastTag Toll | ₹40,000 | ₹25,000 | **₹65,000** | **MATCH (100%)** |
| AddBlue & Misc | ₹15,000 | ₹20,000 | **₹35,000** | **MATCH (100%)** |
| Road Expenses | ₹28,735 | ₹11,790 | **₹40,525** | **MATCH (100%)** |
| Driver Commission | ₹40,740 | ₹23,880 | **₹64,620** | **MATCH (100%)** |
| Total Operating Expenses ($P_2$) | ₹2,57,075 | ₹1,83,670 | **₹4,40,745** | **MATCH (100%)** |
| **Net Ledger Profit** | **₹1,25,725** | **₹52,330** | **₹1,78,055** | **MATCH (100%)** |
| **Net Profit Margin** | **32.84%** | **22.17%** | **28.77%** | **MATCH (100%)** |
| Total Driver Advances Paid | ₹78,200 | ₹41,500 | **₹1,19,700** | **MATCH (100%)** |
| Driver Settlement Balance | ₹5,040 (Payable) | ₹68,170 (Receivable) | **Net: ₹63,130 Rec.** | **MATCH (100%)** |
