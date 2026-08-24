import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Edit2,
  Check,
  ImageUp,
  Lock,
  Sparkles,
  Trash2,
  Upload,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  useCategories,
  useIsAdmin,
  useMenuItems,
  useMyShop,
  uploadShopMedia,
} from "@/hooks/useShopData";
import { generateMenu, scanMenuPhoto } from "@/lib/ai.functions";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { money, planOf, type MenuItem } from "@/lib/shop";
import { getFoodImageUrl } from "@/lib/foodImage";

export const Route = createFileRoute("/_authenticated/menu")({
  head: () => ({
    meta: [
      { title: "Menu Builder — MY Link QR" },
      { name: "description", content: "Add categories and items to your digital menu." },
      { property: "og:title", content: "Menu Builder — MY Link QR" },
      {
        property: "og:description",
        content: "Create categories and items for your digital QR menu.",
      },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin(user?.id);
  const { data: shop } = useMyShop(user?.id);
  const { data: categories } = useCategories(shop?.id);
  const { data: items } = useMenuItems(shop?.id);
  const runAi = useServerFn(generateMenu);
  const runScan = useServerFn(scanMenuPhoto);
  const features = planOf(shop?.plan);
  const itemsLeft = features.items - (items?.length ?? 0);
  const catsLeft = features.categories - (categories?.length ?? 0);

  const [catName, setCatName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [scanBusy, setScanBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [scanName, setScanName] = useState("");
  const [scanned, setScanned] = useState<
    { name: string; description: string; price: number; category: string }[]
  >([]);
  const [form, setForm] = useState({ name: "", price: "", description: "", category_id: "", image_url: "" });
  const [addPhotoBusy, setAddPhotoBusy] = useState(false);

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    description: "",
    category_id: "",
    image_url: "",
  });
  const [editBusy, setEditBusy] = useState(false);

  function openEdit(item: MenuItem) {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      price: item.price.toString(),
      description: item.description ?? "",
      category_id: item.category_id ?? "",
      image_url: item.image_url ?? "",
    });
  }

  async function uploadNewItemImage(file?: File) {
    if (!file || !shop) return;
    setAddPhotoBusy(true);
    try {
      const url = await uploadShopMedia(file, shop.id);
      setForm((prev) => ({ ...prev, image_url: url }));
      toast.success("Item photo uploaded!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setAddPhotoBusy(false);
    }
  }

  async function uploadItemImage(file?: File) {
    if (!file || !shop) return;
    setEditBusy(true);
    try {
      const url = await uploadShopMedia(file, shop.id);
      setEditForm({ ...editForm, image_url: url });
      toast.success("Image uploaded successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setEditBusy(false);
    }
  }

  async function saveEdit() {
    if (!editingItem || !shop) return;
    const price = Number(editForm.price);
    if (!Number.isFinite(price) || price < 0) {
      toast.error("Enter a valid price");
      return;
    }

    setEditBusy(true);
    const { error } = await supabase
      .from("menu_items")
      .update({
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        price,
        category_id: editForm.category_id || null,
        image_url: editForm.image_url || null,
      })
      .eq("id", editingItem.id);

    setEditBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Item updated");
    setEditingItem(null);
    refresh();
  }

  function refresh() {
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["menu-items"] });
  }

  async function addCategory() {
    if (!shop || catName.trim().length < 2) return;
    if (catsLeft <= 0) {
      toast.error(
        `Your ${shop.plan} plan allows ${features.categories} categories. Upgrade to add more.`,
      );
      return;
    }
    const { error } = await supabase
      .from("categories")
      .insert({ shop_id: shop.id, name: catName.trim(), position: categories?.length ?? 0 });
    if (error) {
      toast.error(error.message);
      return;
    }
    setCatName("");
    refresh();
  }

  async function addItem() {
    if (!shop || form.name.trim().length < 2) {
      toast.error("Item name required");
      return;
    }
    if (itemsLeft <= 0) {
      toast.error(`Your ${shop.plan} plan allows ${features.items} items. Upgrade to add more.`);
      return;
    }
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) {
      toast.error("Enter a valid price");
      return;
    }
    const finalImageUrl = form.image_url.trim() || getFoodImageUrl(form.name.trim());
    const { error } = await supabase.from("menu_items").insert({
      shop_id: shop.id,
      name: form.name.trim(),
      description: form.description.trim() || null,
      price,
      category_id: form.category_id || null,
      image_url: finalImageUrl,
      position: items?.length ?? 0,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setForm({ name: "", price: "", description: "", category_id: form.category_id, image_url: "" });
    refresh();
  }

  async function remove(table: "categories" | "menu_items", id: string) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    refresh();
  }

  async function aiGenerate() {
    if (!shop) return;
    if (!features.ai) {
      toast.error("AI menu generator is available on Pro and Premium plans.");
      return;
    }
    setBusy(true);
    try {
      const result = await runAi({
        data: { prompt: prompt || `${shop.niche} named ${shop.name}` },
      });
      for (const [ci, cat] of result.categories.entries()) {
        const { data: created, error } = await supabase
          .from("categories")
          .insert({ shop_id: shop.id, name: cat.name, position: (categories?.length ?? 0) + ci })
          .select("id")
          .single();
        if (error) throw error;
        await supabase.from("menu_items").insert(
          cat.items.map((it, ii) => ({
            shop_id: shop.id,
            category_id: created.id,
            name: it.name,
            description: it.description,
            price: it.price,
            image_url: getFoodImageUrl(it.name, cat.name),
            position: ii,
          })),
        );
      }
      toast.success("Menu generated");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setBusy(false);
    }
  }

  async function scanPhoto(file: File | undefined) {
    if (!file) return;
    if (!features.ai) {
      toast.error("Menu photo scanning is available on Pro and Premium plans.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Choose a menu photo in JPG, PNG or WebP format.");
      return;
    }
    if (file.size > 5_000_000) {
      toast.error("Photo must be smaller than 5 MB.");
      return;
    }
    setScanBusy(true);
    setScanName(file.name);
    setScanned([]);
    try {
      const image = await readImage(file);
      const result = await runScan({ data: { image } });
      if (result.items.length === 0) throw new Error("No readable menu items were found.");
      setScanned(result.items);
      toast.success(`Found ${result.items.length} menu items`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not scan that menu photo");
    } finally {
      setScanBusy(false);
    }
  }

  async function importScanned() {
    if (!shop || scanned.length === 0) return;
    const categoryNames = [...new Set(scanned.map((item) => item.category.trim() || "General"))];
    const existingNames = new Set(
      (categories ?? []).map((category) => category.name.toLowerCase()),
    );
    const newCategoryCount = categoryNames.filter(
      (name) => !existingNames.has(name.toLowerCase()),
    ).length;
    if (scanned.length > itemsLeft || newCategoryCount > catsLeft) {
      toast.error(
        "This import exceeds your current plan limits. Remove some items or upgrade your plan.",
      );
      return;
    }

    setImportBusy(true);
    try {
      const categoryIds = new Map(
        (categories ?? []).map((category) => [category.name.toLowerCase(), category.id]),
      );
      for (const [index, name] of categoryNames.entries()) {
        if (categoryIds.has(name.toLowerCase())) continue;
        const { data, error } = await supabase
          .from("categories")
          .insert({ shop_id: shop.id, name, position: (categories?.length ?? 0) + index })
          .select("id")
          .single();
        if (error) throw error;
        categoryIds.set(name.toLowerCase(), data.id);
      }

      const { error } = await supabase.from("menu_items").insert(
        scanned.map((item, index) => ({
          shop_id: shop.id,
          category_id: categoryIds.get((item.category.trim() || "General").toLowerCase()) ?? null,
          name: item.name.trim(),
          description: item.description.trim() || null,
          price: item.price,
          image_url: getFoodImageUrl(item.name, item.category),
          position: (items?.length ?? 0) + index,
        })),
      );
      if (error) throw error;
      toast.success(`${scanned.length} items added to your menu`);
      setScanned([]);
      setScanName("");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add the scanned menu");
    } finally {
      setImportBusy(false);
    }
  }

  if (!shop) {
    return (
      <DashboardShell title="Menu" isAdmin={isAdmin}>
        <p className="text-sm text-muted-foreground">Create your shop on the dashboard first.</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Menu" description="Build your categories and items." isAdmin={isAdmin}>
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4 text-sm">
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium capitalize text-primary">
          {shop.plan} plan
        </span>
        <span className="text-muted-foreground">
          Items {items?.length ?? 0}
          {Number.isFinite(features.items) ? ` / ${features.items}` : " (unlimited)"}
        </span>
        <span className="text-muted-foreground">
          Categories {categories?.length ?? 0}
          {Number.isFinite(features.categories) ? ` / ${features.categories}` : " (unlimited)"}
        </span>
      </div>
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">AI menu generator</h2>
              {!features.ai && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  <Lock className="size-3" /> Pro
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {features.ai
                ? "Describe your business and get a full draft."
                : "Upgrade to Pro to generate a full menu from one line of text."}
            </p>
            <Input
              className="mt-3"
              disabled={!features.ai}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`${shop.niche} in Kerala`}
            />
            <Button className="mt-3 w-full" onClick={aiGenerate} disabled={busy || !features.ai}>
              <Sparkles className="size-4" /> {busy ? "Generating…" : "Generate menu"}
            </Button>
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-semibold">
                <ImageUp className="size-4 text-primary" /> Scan menu photo
              </h2>
              {!features.ai && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  <Lock className="size-3" /> Pro
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload a clear photo to extract item names, prices and categories.
            </p>
            <Label
              htmlFor="menu-photo"
              className="mt-4 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-4 text-center transition hover:bg-muted/60"
            >
              <Upload className="mb-2 size-5 text-primary" />
              <span className="text-sm font-medium">
                {scanBusy ? "Reading menu…" : scanName || "Choose menu photo"}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                JPG, PNG or WebP · max 5 MB
              </span>
            </Label>
            <input
              id="menu-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={scanBusy || !features.ai}
              onChange={(event) => void scanPhoto(event.target.files?.[0])}
            />
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-semibold">Categories</h2>
            <div className="mt-3 flex gap-2">
              <Input
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Starters"
              />
              <Button onClick={addCategory}>Add</Button>
            </div>
            <ul className="mt-4 space-y-2">
              {(categories ?? []).map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  {c.name}
                  <button
                    aria-label={`Delete ${c.name}`}
                    onClick={() => remove("categories", c.id)}
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          {scanned.length > 0 && (
            <section className="rounded-2xl border border-primary/30 bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 font-semibold">
                    <Check className="size-4 text-primary" /> Scan ready
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Review {scanned.length} extracted items before importing.
                  </p>
                </div>
                <Button onClick={importScanned} disabled={importBusy}>
                  {importBusy ? "Adding…" : `Add all ${scanned.length} items`}
                </Button>
              </div>
              <div className="mt-4 overflow-hidden rounded-xl border">
                <div className="grid grid-cols-[1fr_100px_32px] gap-3 bg-muted/60 px-3 py-2 text-xs font-medium text-muted-foreground sm:grid-cols-[130px_1fr_100px_32px]">
                  <span className="hidden sm:block">Category</span>
                  <span>Item & Details</span>
                  <span className="text-right">Price</span>
                  <span></span>
                </div>
                <ul className="max-h-96 divide-y overflow-y-auto">
                  {scanned.map((item, index) => (
                    <li
                      key={`${item.category}-${item.name}-${index}`}
                      className="grid grid-cols-[1fr_100px_32px] items-center gap-3 px-3 py-3 text-sm sm:grid-cols-[130px_1fr_100px_32px]"
                    >
                      <span className="hidden truncate font-medium text-muted-foreground sm:block">
                        {item.category}
                      </span>
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={getFoodImageUrl(item.name, item.category)}
                          alt={item.name}
                          className="size-10 rounded-lg object-cover shrink-0 border border-black/10"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{item.name}</p>
                          {item.description && (
                            <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                          )}
                          <p className="truncate text-xs text-primary sm:hidden font-medium">
                            {item.category}
                          </p>
                        </div>
                      </div>
                      <span className="text-right font-bold">
                        {money(item.price, shop.currency)}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => setScanned((prev) => prev.filter((_, i) => i !== index))}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1 flex justify-center"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-semibold">Add item</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="i-name">Name</Label>
                <Input
                  id="i-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="i-price">Price</Label>
                <Input
                  id="i-price"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="i-desc">Description</Label>
                <Input
                  id="i-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="i-cat">Category</Label>
                <select
                  id="i-cat"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                >
                  <option value="">Uncategorised</option>
                  {(categories ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="i-photo">Item Photo (Optional)</Label>
                <div className="flex items-center gap-4">
                  {form.image_url ? (
                    <img
                      src={form.image_url}
                      alt="Preview"
                      className="size-14 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="grid size-14 place-items-center rounded-xl border border-dashed bg-muted text-muted-foreground shrink-0">
                      <ImageIcon className="size-5" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      id="i-photo"
                      type="file"
                      accept="image/*"
                      disabled={addPhotoBusy}
                      onChange={(e) => uploadNewItemImage(e.target.files?.[0])}
                      className="cursor-pointer text-xs"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Choose photo or leave blank for automatic food photo matching
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <Button className="mt-4" onClick={addItem}>
              Add item
            </Button>
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-semibold">Items ({items?.length ?? 0})</h2>
            <ul className="mt-3 divide-y">
              {(items ?? []).map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {i.image_url ? (
                      <img
                        src={i.image_url}
                        alt={i.name}
                        className="size-12 rounded-xl object-cover shrink-0 border border-black/10"
                      />
                    ) : (
                      <div className="grid size-12 place-items-center rounded-xl border border-dashed bg-muted shrink-0 text-muted-foreground">
                        <ImageIcon className="size-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium">{i.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{i.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{money(i.price, shop.currency)}</span>
                    <button
                      aria-label={`Edit ${i.name}`}
                      onClick={() => openEdit(i as unknown as MenuItem)}
                    >
                      <Edit2 className="size-4 text-muted-foreground hover:text-primary transition-colors" />
                    </button>
                    <button
                      aria-label={`Delete ${i.name}`}
                      onClick={() => remove("menu_items", i.id)}
                    >
                      <Trash2 className="size-4 text-muted-foreground hover:text-destructive transition-colors" />
                    </button>
                  </div>
                </li>
              ))}
              {(items?.length ?? 0) === 0 && (
                <p className="py-3 text-sm text-muted-foreground">No items yet.</p>
              )}
            </ul>
          </section>
        </div>
      </div>

      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Item Photo</Label>
              <div className="flex items-center gap-4">
                {editForm.image_url ? (
                  <img
                    src={editForm.image_url}
                    alt="Item"
                    className="size-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="grid size-16 place-items-center rounded-xl border border-dashed bg-muted">
                    <ImageIcon className="size-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => uploadItemImage(e.target.files?.[0])}
                    disabled={editBusy}
                    className="cursor-pointer"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">JPG, PNG or WebP · max 5 MB</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="e-name">Name</Label>
                <Input
                  id="e-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-price">Price</Label>
                <Input
                  id="e-price"
                  inputMode="decimal"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="e-desc">Description</Label>
                <Input
                  id="e-desc"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="e-cat">Category</Label>
                <select
                  id="e-cat"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={editForm.category_id}
                  onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
                >
                  <option value="">Uncategorised</option>
                  {(categories ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)} disabled={editBusy}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={editBusy}>
              {editBusy && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

function readImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Could not read photo"));
    reader.onerror = () => reject(new Error("Could not read photo"));
    reader.readAsDataURL(file);
  });
}
