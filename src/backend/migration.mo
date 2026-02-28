import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";

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
    purchaseCategories : List.List<Text>;
    expenseCategories : List.List<Text>;
  };

  type NewActor = {
    entries : Map.Map<Text, DailyEntry>;
    purchaseCategories : List.List<CategoryItem>;
    expenseCategories : List.List<CategoryItem>;
  };

  public func run(old : OldActor) : NewActor {
    let purchaseCategories = List.fromArray<CategoryItem>([
      { name = "General"; defaultPrice = 0.0 },
      { name = "Food"; defaultPrice = 0.0 },
      { name = "Supplies"; defaultPrice = 0.0 },
    ]);
    let expenseCategories = List.fromArray<CategoryItem>([
      { name = "Utilities"; defaultPrice = 0.0 },
      { name = "Maintenance"; defaultPrice = 0.0 },
      { name = "Other"; defaultPrice = 0.0 },
    ]);
    {
      old with purchaseCategories;
      expenseCategories;
    };
  };
};
