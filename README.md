# Budget Planner

Budget Planner is a personal budgeting app for recording income and expenses, setting monthly category budgets, importing supported M-Pesa confirmation messages, and reviewing spending over time. The Android version is packaged as an installable APK and includes the app files on the device, so it works offline after installation.

The interface is built with HTML, CSS, and JavaScript and packaged for Android using Capacitor.

## Features

- **Monthly overview** — view income, expenses, and balance for the selected month.
- **Transactions** — add, edit, remove, and search income and expense entries.
- **Category budgets** — use the built-in categories or add your own categories and monthly limits.
- **Budget rollover** — optionally carry the unused amount from the previous month into the current category budget.
- **M-Pesa message import** — paste supported confirmation SMS messages to create transactions.
- **Spending insights** — see category spending, a six-month income and expense trend, and a 50/30/20 breakdown.
- **Budget prompts** — get summaries about overspending, potential areas to cut, progress against limits, and largest expenses.
- **Recurring bills** — set a bill, amount, category, and posting day. The app posts it when opened on or after that day of the month.
- **Savings goals** — set targets and record contributions toward them.
- **Debts and loans** — track amounts owed or owed to you and record repayments.
- **CSV export** — export all recorded transactions.
- **Appearance** — choose a light or dark theme, a color palette, and the background blur strength.
- **Optional PIN screen** — hide the app behind a four-digit PIN screen.
- **Responsive layout** — use the app on desktop or mobile, with Home, Plan, and Insights navigation.

## Install on Android

1. Open the repository's [Actions page](https://github.com/WanceJ12/Budget-Planner/actions).
2. Open the latest successful **Build Budget Planner for Android** run on the `main` branch.
3. Under **Artifacts**, download `budget-planner-android`.
4. Extract the downloaded ZIP to get `app-debug.apk`, then open that APK on the Android device and follow the install prompts.

Android may ask you to allow installation from the browser or file manager used to open the APK. Only install APKs from a trusted source. The debug APK is unsigned for Play Store distribution, but can be installed directly on Android.

The app runs as an installed Android app and its interface does not require a website or an internet connection. The APK is built in GitHub Actions when changes are pushed to `main`; workflow artifacts are available for 30 days. Tagged releases (`v*`) also include the APK as a release download.

## Build the Android app

Requirements: Node.js 22, Java 21, Android Studio/Android SDK, and Android build tools.

```sh
npm ci
npm run cap:sync
cd android
./gradlew assembleDebug
```

The Android project is included in the repository. The generated APK is `android/app/build/outputs/apk/debug/app-debug.apk`. On Windows, run `.\gradlew.bat assembleDebug` from the `android` directory. To generate a fresh Android project instead, remove the existing `android` directory and run `npx cap add android` after `npm ci`.

## Using the app

### Record income or an expense

1. In **Add transaction**, choose **Expense** or **Income**.
2. Enter a positive amount.
3. For an expense, select a category. The category selector is hidden for income.
4. Choose the transaction date and optionally enter a note.
5. Select **Add**.

Transactions are shown in the month matching their date. To change an existing entry, find it in **Transactions**, select the edit button, update its details, then save. Use the remove button to delete an entry.

Use the search field above the transaction list to filter by category or note.

### Manage category budgets

The app starts with these categories and monthly limits:

| Category | Default monthly limit |
| --- | ---: |
| Housing | KSh 15,000 |
| Food | KSh 8,000 |
| Transport | KSh 4,000 |
| Fun | KSh 2,000 |
| Bills | KSh 5,000 |
| Other | KSh 2,000 |

To create or update a category, enter its name and a non-negative monthly limit, then select **Add / update**. The limit is required; use `0` if you do not want to set a spending target. Select **remove** on a category card to delete that category.

Category budgets determine the spending cards and budget summaries. Removing a category does not automatically remove older transactions assigned to it.

Turn on **Roll unspent money over to next month** to add the prior month's unused category budget to the selected month's limit. This uses transactions recorded for the previous calendar month.

### Import M-Pesa messages

Paste one or more M-Pesa SMS messages in **Import M-Pesa messages**, then select **Import**. The importer looks for an amount marked `KSh` or `KES`; it also recognizes a confirmation code in the common `... Confirmed` format for duplicate detection. It uses a date written as `on D/M/YY`, `on DD/MM/YYYY`, or with hyphens when available. Otherwise, it uses today's date.

For example, a message containing text like this can be recognized:

```text
QWERTY1234 Confirmed. Ksh1,250.00 sent to Java House on 14/10/26.
```

The app infers income from messages containing words such as “received”, “credited”, or “deposit”; other recognized messages are treated as expenses. It attempts to choose a category based on words in the message and uses **Other** when no known category matches.

Import is a text parser, not a connection to M-Pesa or Safaricom. SMS formats can vary; messages without a recognizable amount are reported and not imported. A parsed transaction may be assigned to a different month than the one currently selected, so check the month selector if an imported entry is not visible.

### Review insights

- **Charts** shows expense totals by category for the selected month and income/expense totals over the six months ending in that month.
- **50/30/20 split** compares recorded income against a needs target of 50%, wants target of 30%, and savings target of 20%. Housing, Food, Transport, and Bills count as needs; other categories count as wants. Savings is calculated as income minus expenses, with negative savings displayed as zero.
- **Ask your budget** summarizes spending relative to category limits and highlights large expense categories or entries.
- **History** lists months with transactions. Select a month to view it.

### Recurring bills

Enter the bill name, amount, category, and a day from 1 to 28, then select **Add bill**. When the app is opened on or after that day, it records the bill as an expense for the current month if it has not already posted for that month. The app must be opened for this check to run; it does not run in the background.

Use the remove button next to a recurring bill to stop future automatic entries. Previously posted transactions remain in the transaction history.

### Savings goals and debts

Create a savings goal by entering its name and target. Use **Add savings** to record contributions and **Remove** to delete the goal.

For a debt or loan, enter the other party, amount, and whether you owe them or they owe you. Use **Record** to add a repayment and **Remove** to delete the record.

### Export transactions

Select **Export CSV** in **Export & install**. The export contains all recorded transactions with date, type, category, amount, and note. Depending on the browser or host environment, the app downloads a CSV file or displays the CSV text so it can be copied.

### PIN and appearance

Set a PIN using exactly four digits. The PIN displays a privacy screen when the app is opened; it does **not** encrypt saved data. Use **Remove PIN** to disable the screen.

The Appearance section provides light/dark modes, color palettes, and a blur slider.

## Data and privacy

- In a regular browser, app data is saved in that browser's `localStorage` under the `bp` key. It is local to that browser profile and device; clearing site/browser data can erase it.
- In supported host environments that provide the `claude` database and user APIs, the app uses a per-user database document instead. Otherwise, it falls back to browser storage.
- This app does not fetch bank or M-Pesa account data. M-Pesa import uses only the text pasted into the app.
- A PIN is only a screen lock. It is not encryption or a substitute for securing the device.
- Export a CSV periodically if you want an independent copy of your transaction history.

## Project files

| File | Purpose |
| --- | --- |
| `index.html` | App structure, form controls, and page sections. |
| `budget.css` | Layout, responsive styles, themes, and visual presentation. |
| `budget.js` | Transaction logic, rendering, import parsing, calculations, and persistence. |
| `capacitor.config.json` | Android package identity and bundled web asset settings. |
| `scripts/copy-web-assets.cjs` | Copies the app files into the Android package before syncing. |
| `.github/workflows/android.yml` | Builds downloadable APKs in GitHub Actions. |
| `README.md` | Installation, use, and project documentation. |

## Troubleshooting

- **A transaction is missing:** check that the selected month matches the transaction date; search by its note or category.
- **An M-Pesa message did not import:** ensure it includes a recognizable `KSh` or `KES` amount. Check the import result for messages that could not be parsed.
- **A recurring bill has not appeared:** recurring entries are created when the app is opened on or after the configured day (up to day 28).
- **Changes are not retained:** check that browser storage is enabled and that the app is being opened in the same browser profile. Avoid clearing the browser's site data.
- **A PIN does not protect saved information:** this is expected; the PIN is a privacy screen and does not encrypt data.
