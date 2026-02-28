import Map "mo:core/Map";
import Text "mo:core/Text";
import Float "mo:core/Float";
import List "mo:core/List";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Migration "migration";

// Use with-clause to apply migration logic
(with migration = Migration.run)
actor {
  type Item = {
    description : Text;
    amount : Float;
    outlet : Text;
  };

  type DailyEntry = {
    date : Text;
    purchases : [Item];
    expenses : [Item];
    rajajiSale : Float;
    oldRaoSale : Float;
    saroorpurSale : Float;
  };

  type EntryWithTotals = {
    date : Text;
    purchases : [Item];
    expenses : [Item];
    rajajiSale : Float;
    oldRaoSale : Float;
    saroorpurSale : Float;
    totalPurchase : Float;
    totalExpense : Float;
    totalSale : Float;
    profitLoss : Float;
  };

  type CategoryItem = {
    name : Text;
    defaultPrice : Float;
  };

  let entries = Map.empty<Text, DailyEntry>();
  let purchaseCategories : List.List<CategoryItem> = List.fromArray<CategoryItem>([
    { name = "General"; defaultPrice = 0.0 },
    { name = "Food"; defaultPrice = 0.0 },
    { name = "Supplies"; defaultPrice = 0.0 },
  ]);
  let expenseCategories : List.List<CategoryItem> = List.fromArray<CategoryItem>([
    { name = "Utilities"; defaultPrice = 0.0 },
    { name = "Maintenance"; defaultPrice = 0.0 },
    { name = "Other"; defaultPrice = 0.0 },
  ]);

  func calculateTotals(entry : DailyEntry) : EntryWithTotals {
    let totalPurchase = entry.purchases.foldLeft(0.0, func(acc, item) { acc + item.amount });
    let totalExpense = entry.expenses.foldLeft(0.0, func(acc, item) { acc + item.amount });
    let totalSale = entry.rajajiSale + entry.oldRaoSale + entry.saroorpurSale;
    let profitLoss = totalSale - (totalPurchase + totalExpense);

    {
      date = entry.date;
      purchases = entry.purchases;
      expenses = entry.expenses;
      rajajiSale = entry.rajajiSale;
      oldRaoSale = entry.oldRaoSale;
      saroorpurSale = entry.saroorpurSale;
      totalPurchase;
      totalExpense;
      totalSale;
      profitLoss;
    };
  };

  public shared ({ caller }) func saveEntry(entry : DailyEntry) : async () {
    entries.add(entry.date, entry);
  };

  public shared ({ caller }) func saveEntries(entryArray : [DailyEntry]) : async () {
    for (entry in entryArray.values()) {
      entries.add(entry.date, entry);
    };
  };

  public query ({ caller }) func getEntryByDate(date : Text) : async ?EntryWithTotals {
    switch (entries.get(date)) {
      case (null) { null };
      case (?entry) { ?calculateTotals(entry) };
    };
  };

  public query ({ caller }) func getEntriesByMonth(year : Text, month : Text) : async [DailyEntry] {
    let prefix = year # "-" # month # "-";
    entries.toArray().filter(func((date, _)) { date.startsWith(#text prefix) }).map(func((_, entry)) { entry });
  };

  public query ({ caller }) func getEntriesByYear(year : Text) : async [DailyEntry] {
    let prefix = year # "-";
    entries.toArray().filter(func((date, _)) { date.startsWith(#text prefix) }).map(func((_, entry)) { entry });
  };

  public query ({ caller }) func getAllEntries() : async [DailyEntry] {
    entries.values().toArray();
  };

  public query ({ caller }) func getPurchaseCategoriesWithPrice() : async [CategoryItem] {
    purchaseCategories.toArray();
  };

  public query ({ caller }) func getExpenseCategoriesWithPrice() : async [CategoryItem] {
    expenseCategories.toArray();
  };

  public shared ({ caller }) func addPurchaseCategoryWithPrice(name : Text, defaultPrice : Float) : async () {
    if (purchaseCategories.any(func(cat) { Text.equal(cat.name, name) })) {
      Runtime.trap("Category already exists");
    };
    purchaseCategories.add({ name; defaultPrice });
  };

  public shared ({ caller }) func addExpenseCategoryWithPrice(name : Text, defaultPrice : Float) : async () {
    if (expenseCategories.any(func(cat) { Text.equal(cat.name, name) })) {
      Runtime.trap("Category already exists");
    };
    expenseCategories.add({ name; defaultPrice });
  };

  public shared ({ caller }) func updatePurchaseCategoryPrice(name : Text, newPrice : Float) : async () {
    let updatedList = purchaseCategories.map<CategoryItem, CategoryItem>(
      func(cat) {
        if (Text.equal(cat.name, name)) {
          { cat with defaultPrice = newPrice };
        } else {
          cat;
        };
      }
    );
    purchaseCategories.clear();
    let updatedArray = updatedList.toArray();
    purchaseCategories.addAll(updatedArray.values());
  };

  public shared ({ caller }) func updateExpenseCategoryPrice(name : Text, newPrice : Float) : async () {
    let updatedList = expenseCategories.map<CategoryItem, CategoryItem>(
      func(cat) {
        if (Text.equal(cat.name, name)) {
          { cat with defaultPrice = newPrice };
        } else {
          cat;
        };
      }
    );
    expenseCategories.clear();
    let updatedArray = updatedList.toArray();
    expenseCategories.addAll(updatedArray.values());
  };

  public shared ({ caller }) func deletePurchaseCategoryWithPrice(name : Text) : async () {
    let filtered = purchaseCategories.filter(func(cat) { not Text.equal(cat.name, name) });
    purchaseCategories.clear();
    let filteredArray = filtered.toArray();
    purchaseCategories.addAll(filteredArray.values());
  };

  public shared ({ caller }) func deleteExpenseCategoryWithPrice(name : Text) : async () {
    let filtered = expenseCategories.filter(func(cat) { not Text.equal(cat.name, name) });
    expenseCategories.clear();
    let filteredArray = filtered.toArray();
    expenseCategories.addAll(filteredArray.values());
  };
};

