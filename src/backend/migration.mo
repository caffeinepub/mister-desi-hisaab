import Map "mo:core/Map";
import Float "mo:core/Float";
import List "mo:core/List";

module {
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

  type CategoryItem = {
    name : Text;
    defaultPrice : Float;
  };

  type OldActor = {
    entries : Map.Map<Text, DailyEntry>;
    purchaseCategories : List.List<CategoryItem>;
    expenseCategories : List.List<CategoryItem>;
  };

  type SaleItem = {
    name : Text;
    quantity : Nat;
    freeQuantity : Nat;
    amount : Float;
  };

  type ShiftEntry = {
    purchases : [Item];
    expenses : [Item];
    sales : [SaleItem];
  };

  type NewDailyEntry = {
    date : Text;
    morning : ShiftEntry;
    evening : ShiftEntry;
  };

  type NewActor = {
    entries : Map.Map<Text, NewDailyEntry>;
    purchaseCategories : List.List<CategoryItem>;
    expenseCategories : List.List<CategoryItem>;
    saleCategories : List.List<CategoryItem>;
  };

  public func run(old : OldActor) : NewActor {
    let saleCategories = List.fromArray<CategoryItem>([
      { name = "Water Bottle"; defaultPrice = 30.0 },
      { name = "Cold-Drink"; defaultPrice = 40.0 },
    ]);

    let newEntries = old.entries.map<Text, DailyEntry, NewDailyEntry>(
      func(_, oldEntry) {
        let emptySales : [SaleItem] = [];

        let morningShift = {
          purchases = oldEntry.purchases;
          expenses = oldEntry.expenses;
          sales = emptySales;
        };

        let eveningShift = {
          purchases = [];
          expenses = [];
          sales = emptySales;
        };

        {
          date = oldEntry.date;
          morning = morningShift;
          evening = eveningShift;
        };
      }
    );

    {
      entries = newEntries;
      purchaseCategories = old.purchaseCategories;
      expenseCategories = old.expenseCategories;
      saleCategories;
    };
  };
};
