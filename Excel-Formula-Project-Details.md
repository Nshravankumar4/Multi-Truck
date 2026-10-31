# Master Excel Formula Audit & Reconciled Project Details
## Transport Brokerage Ledger Pvt Ltd (P2)
**Cell-by-Cell Mathematical Audit of Master Fleet Workbooks**  
*Document Version: 2.0.0 • Developed by Shravan Kumar • 2026*

---

## 1. Master Workbooks Inspected

The application architecture reconciles two primary workbooks in `E:\TR\P2\`:
1. `E:\TR\P2\Y\Truck_Detials_1122_6666_P and L Account.xlsx`
2. `E:\TR\P2\X\Truck_Detials_1122_6666_Drivers.xlsx`

Both workbooks were decoded directly from their OpenXML source packages (`xl/worksheets/sheet1.xml`, `sheet2.xml`, `sheet3.xml`, and `xl/sharedStrings.xml`) to extract exact formulas, dimensions, shared string indices, and calculated values.

---

## 2. Workbook 1: P&L Account (`1122_6666_P&L Account`)

### 2.1 Truck 1: `TG15T6666` (Period: `01-10-2026 To 20-10-2026`)

#### Section A: Freight Revenue ($P_1$)
| Cell Coordinate | Field Name / Route | Cell Content / Formula | Evaluated Value |
| :--- | :--- | :--- | :--- |
| `C11:D11` | 01-10-26 TO 06-10-26 | `MDCL TO MADHAPURA` | String |
| `E11` | Freight Trip 1 | Literal | **₹1,75,000** |
| `C12:D12` | 09-10-26 TO 14-10-26 | `AURGANGABAD TO HYD` | String |
| `E12` | Freight Trip 2 | Literal | **₹1,08,500** |
| `C13:D13` | 15-10-26 TO 17-10-26 | `K"NAG TO KURNOOL` | String |
| `E13` | Freight Trip 3 | Literal | **₹72,300** |
| `C14:D14` | 18-10-26 TO 19-10-26 | `KURNOOL TO MDCL` | String |
| `E14` | Freight Trip 4 | Literal | **₹27,000** |
| `C15` | Label | `P1:Total Sum` | String |
| `E15` | **Total Freight ($P_1$)** | `=SUM(E11:E14)` | **₹3,82,800** |

#### Section B: Operating Expenses ($P_2$)
| Cell Coordinate | Expense Line Item | Cell Formula / Value | Reconciled Amount |
| :--- | :--- | :--- | :--- |
| `D18:E18` | Diesel Entry 1 | Literal | ₹30,500 |
| `E19` | Diesel Entry 2 | Literal | ₹30,500 |
| `E20` | Diesel Entry 3 | Literal | ₹31,600 |
| `E21` | Diesel Entry 4 | Literal | ₹13,000 |
| `E22` | Diesel Entry 5 | Literal | ₹27,000 |
| *Subtotal* | *Diesel Fuel Sum* | *Literal sum of 5 entries* | *₹1,32,600* |
| `C23:E23` | Road Expenses (01-10 to 20-10) | Cross-reference from Driver Sheet | ₹28,735 |
| `D24:E24` | FastTag Tolls | Literal | ₹40,000 |
| `D25:E25` | AddBlue & Minor Expenses | Literal | ₹15,000 |
| `D26:E26` | Driver Salary (12% Commission) | Cross-reference from Driver Sheet | ₹40,740 |
| `D27` | Label | `P2: Total` | String |
| `E27` | **Total Operating Expenses ($P_2$)** | `=SUM(E18:E26)` | **₹2,57,075** |

#### Section C: Net Profit Calculation
| Cell Coordinate | Formula Expression | Calculation | Reconciled Result |
| :--- | :--- | :--- | :--- |
| `D29` | Label: `P1-P2 Total` | N/A | String |
| `E29` | **Net Operating Profit** | `=E15-E27` | **₹1,25,725** |
| `Profit Margin` | $\frac{P_1 - P_2}{P_1} \times 100$ | $\frac{1,25,725}{3,82,800} \times 100$ | **32.84%** |

---

### 2.2 Truck 2: `TS15UE1122` (Period: `04-10-2026 To 20-10-2026`)

#### Section A: Freight Revenue ($xP_1$)
| Cell Coordinate | Field Name / Route | Cell Content / Formula | Evaluated Value |
| :--- | :--- | :--- | :--- |
| `J11:K11` | 04-10-26 TO 06-10-26 | `MDCL TO CHEGUNTA` | String |
| `L11` | Freight Trip 1 | Literal | **₹15,000** |
| `J12:K12` | 06-10-26 TO 09-10-26 | `MDCL TO MUZZFARPUR` | String |
| `L12` | Freight Trip 2 | Literal | **₹1,41,000** |
| `J13:K13` | 11-10-26 TO 13-10-26 | `JABALPUR TO BHONIGIRI` | String |
| `L13` | Freight Trip 3 | Literal | **₹80,000** |
| `K14` | Label | `Xp1: Total` | String |
| `L14` | **Total Freight ($xP_1$)** | `=SUM(L11:L13)` | **₹2,36,000** |

#### Section B: Operating Expenses ($xP_2$)
| Cell Coordinate | Expense Line Item | Cell Formula / Value | Reconciled Amount |
| :--- | :--- | :--- | :--- |
| `K18:L18` | Diesel Entry 1 | Literal | ₹24,000 |
| `L19` | Diesel Entry 2 | Literal | ₹19,000 |
| `L20` | Diesel Entry 3 | Literal | ₹23,000 |
| `L21` | Diesel Entry 4 | Literal | ₹10,000 |
| `L22` | Diesel Entry 5 | Literal | ₹27,000 |
| *Subtotal* | *Diesel Fuel Sum* | *Literal sum of 5 entries* | *₹1,03,000* |
| `J23:L23` | Road Expenses (01-10 to 20-10) | Cross-reference from Driver Sheet | ₹11,790 |
| `K24:L24` | FastTag Tolls | Literal | ₹25,000 |
| `K25:L25` | AddBlue & Minor Expenses | Literal | ₹20,000 |
| `K26:L26` | Driver Salary (12% Commission) | Cross-reference from Driver Sheet | ₹23,880 |
| `K27` | Label | `xp2: Total` | String |
| `L27` | **Total Operating Expenses ($xP_2$)** | `=SUM(L18:L26)` | **₹1,83,670** |

#### Section C: Net Profit Calculation
| Cell Coordinate | Formula Expression | Calculation | Reconciled Result |
| :--- | :--- | :--- | :--- |
| `K29` | Label: `xP1-xP2 Total` | N/A | String |
| `L29` | **Net Operating Profit** | `=L14-L27` | **₹52,330** |
| `M29` | Note | `Note: Profit` | String |
| `Profit Margin` | $\frac{xP_1 - xP_2}{xP_1} \times 100$ | $\frac{52,330}{2,36,000} \times 100$ | **22.17%** |

---

### 2.3 Combined Fleet Performance (October 2026)
$$\text{Combined Revenue} = ₹3,82,800 + ₹2,36,000 = \mathbf{₹6,18,800}$$
$$\text{Combined Expenses} = ₹2,57,075 + ₹1,83,670 = \mathbf{₹4,40,745}$$
$$\text{Combined Net Profit} = ₹1,25,725 + ₹52,330 = \mathbf{₹1,78,055}$$
$$\text{Combined Fleet Margin} = \frac{1,78,055}{6,18,800} \times 100 = \mathbf{28.77\%}$$

---

## 3. Workbook 2: Driver Settlement (`1122_6666_Driver`)

### 3.1 Driver 1: `DRI NOOR ALLAM - TG15T6666`

#### Eligible Base Trips & 12% Salary Commission
| Cell Coordinate | Trip Dates & Route | Base Lorry Freight | 12% Commission Formula | Reconciled Commission |
| :--- | :--- | :--- | :--- | :--- |
| `K6:M6` | 01-10-26 TO 06-10-26 (MDCL TO MADHAPURA) | ₹1,40,000 | Included in sum | — |
| `K7:M7` | 09-10-26 TO 14-10-26 (AURGANGABAD TO HYD) | ₹1,08,500 | Included in sum | — |
| `K8:M8` | 15-10-26 TO 17-10-26 (K"NAG TO KURNOOL) | ₹64,000 | Included in sum | — |
| `K9:M9` | 18-10-26 TO 19-10-26 (KURNOOL TO MDCL) | ₹27,000 | Included in sum | — |
| `Total Base` | Eligible Freight Base Sum | **₹3,39,500** | `=SUM(M6:M9)` | ₹3,39,500 |
| `M10` | **Total 12% Commission** | N/A | `=SUM(M6:M9)*12%` | **₹40,740** |

#### Driver Account Settlement Reconciliation
| Cell | Component Description | Cell Formula / Reference | Evaluated Amount |
| :--- | :--- | :--- | :--- |
| `L15` | Salary (12% Commission) | `=M10` | ₹40,740 |
| `L16` | Old Balance (B/F from September) | Literal (`I6`) | ₹13,800 |
| `L17` | En-route Expenses (Claimed) | Literal (`I7`) | ₹28,700 |
| `L18` | **Total Driver Credits** | `=SUM(L15:L17)` | **₹83,240** |
| `H19` | **Total Advances Taken (10 entries)** | `=SUM(H9:H18)` | **₹78,200** |
| `L20` | **Net Settlement Balance** | `=L18-L19` | **₹5,040** |
| `M20` | Authoritative Conclusion | `As On Date 20-10-2026, Shankar wants to Pay.` | **Payable to Driver** |

#### Itemized En-Route Road Expenses (`D6:D42`)
Sum of all 37 receipts:
$$\text{Cell } D43 = \text{=SUM(D6:D42)} = \mathbf{₹28,735}$$
*(Includes weighbridge kanta, tarpal, border taxes, police checking, maintenance parts, greasing, and loading fees).*

---

### 3.2 Driver 2: `DRI ALLAM BROT - TS15UE1122`

#### Eligible Base Trips & 12% Salary Commission
| Cell Coordinate | Trip Dates & Route | Base Lorry Freight | 12% Commission Formula | Reconciled Commission |
| :--- | :--- | :--- | :--- | :--- |
| `K53:M53` | 04-10-26 TO 06-10-26 (MDCL TO CHEGUNTA) | ₹10,000 | Included in sum | — |
| `K54:M54` | 06-10-26 TO 09-10-26 (MDCL TO MUZZFARPUR) | ₹1,14,000 | Included in sum | — |
| `K55:M55` | 11-10-26 TO 13-10-26 (JABALPUR TO BHONIGIRI) | ₹75,000 | Included in sum | — |
| `Total Base` | Eligible Freight Base Sum | **₹1,99,000** | `=SUM(M53:M55)` | ₹1,99,000 |
| `M56` | **Total 12% Commission** | N/A | `=SUM(M53:M55)*12%` | **₹23,880** |

#### Driver Account Settlement Reconciliation
| Cell | Component Description | Cell Formula / Reference | Evaluated Amount |
| :--- | :--- | :--- | :--- |
| `H64` | **Driver Advances Taken (6 entries)** | `=SUM(H58:H63)` | **₹41,500** |
| `H65` | Less En-route Road Expenses | Literal | ₹11,790 |
| `H66` | Less Salary 12% Commission | Literal (`M56`) | ₹23,880 |
| `H67` | **Advance Surplus with Driver** | `=H64-H65-H66` | **₹5,830** |
| `H68` | Plus Old Balance (from September) | Literal (`OLD ALLAM WANT PAY`) | ₹62,340 |
| `H69` | **Total Balance with Driver Allam** | `=H67+H68` | **₹68,170** |
| `I69` | Authoritative Conclusion | `As On Date 20-10-2026, Allam wants to Pay Shankar` | **Payable to Owner** |

#### Itemized En-Route Road Expenses (`D53:D74`)
Sum of all 22 receipts:
$$\text{Cell } D75 = \text{=SUM(D53:D74)} = \mathbf{₹11,790}$$

---

## 4. Historical September 2026 Linkages (`Sheet1` & `Sheet2`)

1. **`TG15T6666` September Carry-Forward:**
   - In `Sheet1`, cell `M51` evaluates to `BALC SALARY = 13800/-`.
   - This exact amount was carried forward into October as **Old Balance Shankar Wants to Pay: ₹13,800** (Cell `I6` / `L16`).

2. **`TS15UE1122` September Carry-Forward:**
   - In `Sheet2`, cell `C43` evaluates to `BALC AMOUNT ALLAM = 40,860/- AS ON DATE 03-10-2026`, which reconciled with pending diesel and advance adjustments to form the **Old Balance Allam Wants to Pay: ₹62,340** (Cell `H68`).

---

*© 2026 Transport Brokerage Ledger Pvt Ltd • Developed by Shravan Kumar*

