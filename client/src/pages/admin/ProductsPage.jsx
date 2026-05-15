import { Building2, Edit, Eye, ImagePlus, Plus, RefreshCw, Save, Trash2, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "../../components/layout/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { Drawer } from "../../components/ui/Drawer";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Tabs } from "../../components/ui/Tabs";
import { useAuth } from "../../context/AuthContext";
import { useApiResource } from "../../hooks/useApiResource";
import { api } from "../../services/api";
import { formatMoney } from "../../utils/format";

const fallbackImage = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80";
const schema = z.object({
  name: z.string().min(2, "Nom obligatoire"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Prix invalide"),
  categoryId: z.coerce.number().positive("Categorie obligatoire"),
  preparationTime: z.coerce.number().min(1),
  tva: z.coerce.number().min(0).optional(),
  image: z.string().optional()
});

const normalizeProduct = (product) => ({
  ...product,
  price: Number(product.price || 0),
  tva: Number(product.tva || 0),
  preparationTime: Number(product.preparationTime || 10),
  image: product.image || fallbackImage,
  categoryName: product.category?.name || "Sans categorie",
  establishmentName: product.establishment?.name || `Entite #${product.establishmentId || "-"}`,
  status: product.isAvailable === false ? "OFF" : "ON"
});

export const ProductsPage = () => {
  const { user } = useAuth();
  const [view, setView] = useState("grid");
  const [drawer, setDrawer] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { data: products, loading, error, setData: setProducts, refetch } = useApiResource("/products?limit=100");
  const { data: categories, refetch: refetchCategories } = useApiResource("/categories?limit=100");
  const { data: productManagement } = useApiResource("/settings/product-management");
  const rows = useMemo(() => products.map(normalizeProduct), [products]);
  const categoryOptions = categories.map((category) => ({ value: category.id, label: category.name }));
  const canManageProducts = (productManagement.roles || ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER"]).includes(user?.roleName);
  const isSuperAdmin = user?.roleName === "SUPER_ADMIN";
  const previewMenuUrl = useMemo(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const slug = storedUser.establishment?.slug || "maison-cafe";
    return `/menu?preview=1&establishment=${encodeURIComponent(slug)}`;
  }, []);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { categoryId: "", preparationTime: 10, tva: 10, image: fallbackImage }
  });
  const imagePreview = watch("image") || fallbackImage;

  const openCreate = () => {
    if (!canManageProducts) {
      toast.error("Votre role ne permet pas d'ajouter des produits.");
      return;
    }
    setEditingProduct(null);
    reset({ name: "", description: "", price: "", categoryId: categoryOptions[0]?.value || "", preparationTime: 10, tva: 10, image: fallbackImage });
    setDrawer(true);
  };

  const openEdit = (product) => {
    if (!canManageProducts) {
      toast.error("Votre role ne permet pas de modifier ce produit.");
      return;
    }
    setEditingProduct(product);
    reset({
      name: product.name || "",
      description: product.description || "",
      price: Number(product.price || 0),
      categoryId: product.categoryId || product.category?.id || "",
      preparationTime: Number(product.preparationTime || 10),
      tva: Number(product.tva || 0),
      image: product.image || fallbackImage
    });
    setDrawer(true);
  };

  const saveProduct = async (values) => {
    if (!canManageProducts) {
      toast.error("Votre role ne permet pas de gerer le menu.");
      return;
    }
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const payload = {
        ...values,
        categoryId: Number(values.categoryId),
        price: Number(values.price),
        preparationTime: Number(values.preparationTime),
        tva: Number(values.tva || 0),
        image: values.image || fallbackImage,
        establishmentId: storedUser.establishmentId || 1,
        isAvailable: editingProduct?.isAvailable ?? true
      };
      const response = editingProduct
        ? await api.put(`/products/${editingProduct.id}`, payload)
        : await api.post("/products", payload);

      setProducts((current) => editingProduct
        ? current.map((item) => (item.id === editingProduct.id ? response.data.data : item))
        : [response.data.data, ...current]);
      toast.success(editingProduct ? "Produit modifie" : "Produit cree");
      setDrawer(false);
      setEditingProduct(null);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Impossible d'enregistrer le produit.");
    }
  };

  const uploadProductImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!canManageProducts) {
      toast.error("Votre role ne permet pas de charger une image produit.");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    setUploadingImage(true);
    try {
      const { data } = await api.post("/uploads/image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setValue("image", data.data.url, { shouldDirty: true, shouldValidate: true });
      toast.success("Image chargee");
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Impossible de charger l'image.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const toggleAvailability = async (product) => {
    if (!canManageProducts) {
      toast.error("Votre role ne permet pas de modifier la disponibilite.");
      return;
    }
    try {
      const { data } = await api.put(`/products/${product.id}`, { isAvailable: product.isAvailable === false });
      setProducts((current) => current.map((item) => (item.id === product.id ? data.data : item)));
      toast.success("Disponibilite mise a jour");
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Impossible de modifier la disponibilite.");
    }
  };

  const deleteProduct = async (product) => {
    if (!canManageProducts) {
      toast.error("Votre role ne permet pas de supprimer ce produit.");
      return;
    }
    if (!window.confirm(`Supprimer ${product.name} ?`)) return;
    try {
      await api.delete(`/products/${product.id}`);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      toast.success("Produit supprime");
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Impossible de supprimer le produit.");
    }
  };

  const columns = [
    { header: "Produit", accessorKey: "name", cell: ({ row }) => <div className="flex items-center gap-3"><img src={row.original.image} className="h-11 w-11 rounded-xl object-cover" /><strong className="dark:text-cream">{row.original.name}</strong></div> },
    ...(isSuperAdmin ? [{ header: "Entite", accessorKey: "establishmentName", cell: ({ row }) => <div className="flex items-center gap-2"><Building2 size={16} className="text-copper" /><span className="font-semibold">{row.original.establishmentName}</span></div> }] : []),
    { header: "Categorie", accessorKey: "categoryName" },
    { header: "Prix", accessorKey: "price", cell: ({ row }) => formatMoney(row.original.price) },
    { header: "Prep.", accessorKey: "preparationTime", cell: ({ row }) => `${row.original.preparationTime} min` },
    { header: "Statut", accessorKey: "status", cell: ({ row }) => <Badge tone={row.original.isAvailable === false ? "danger" : "success"}>{row.original.isAvailable === false ? "Off" : "Disponible"}</Badge> },
    { header: "Actions", cell: ({ row }) => <div className="flex gap-2"><Button size="sm" variant="secondary" icon={Edit} disabled={!canManageProducts} onClick={(event) => { event.stopPropagation(); openEdit(row.original); }}>Edit</Button><Button size="sm" variant="secondary" icon={Trash2} disabled={!canManageProducts} onClick={(event) => { event.stopPropagation(); deleteProduct(row.original); }} /></div> }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Menu engineering"
        title="Menu et produits"
        description="Produits, categories, disponibilite, prix, TVA et previsualisation client branches sur MongoDB."
        actions={<><Button variant="secondary" icon={RefreshCw} onClick={() => { refetch(); refetchCategories(); }}>Actualiser</Button><Button variant="secondary" icon={Upload} disabled={!canManageProducts} onClick={() => toast("Import bientot disponible")}>Import</Button><Button icon={Plus} disabled={!canManageProducts} onClick={openCreate}>Produit</Button></>}
      />
      {error && <Card className="p-4 text-sm font-bold text-danger">Produits indisponibles: {error.response?.data?.message || "Erreur API"}</Card>}
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <Tabs tabs={[{ value: "grid", label: "Grille" }, { value: "table", label: "Table" }]} active={view} onChange={setView} />
        <a
          href={previewMenuUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold text-ink shadow-sm transition hover:border-gold dark:border-white/10 dark:bg-white/10 dark:text-cream"
        >
          <Eye size={17} />
          Previsualiser menu client
        </a>
      </div>
      {loading ? <Card className="p-5 text-sm font-bold text-elegant">Chargement des produits...</Card> : view === "table" ? <DataTable data={rows} columns={columns} onRowClick={openEdit} /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {rows.map((product) => (
            <Card key={product.id} interactive className="overflow-hidden">
              <img src={product.image} alt={product.name} className="h-44 w-full object-cover" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2"><h3 className="font-black dark:text-cream">{product.name}</h3><Badge tone={product.isAvailable === false ? "danger" : "success"}>{product.isAvailable === false ? "Off" : "Disponible"}</Badge></div>
                <p className="mt-2 text-sm text-elegant">{product.categoryName} - {product.preparationTime} min - TVA {product.tva}%</p>
                {isSuperAdmin && <p className="mt-1 flex items-center gap-1 text-xs font-bold text-copper"><Building2 size={14} />{product.establishmentName}</p>}
                <p className="mt-2 line-clamp-2 text-sm text-elegant">{product.description || "Aucune description"}</p>
                <div className="mt-4 flex items-center justify-between"><strong>{formatMoney(product.price)}</strong><div className="flex gap-2"><Button size="sm" variant="secondary" disabled={!canManageProducts} onClick={() => toggleAvailability(product)}>{product.isAvailable === false ? "Activer" : "Off"}</Button><Button size="sm" variant="secondary" icon={Edit} disabled={!canManageProducts} onClick={() => openEdit(product)}>Editer</Button><Button size="sm" variant="secondary" icon={Trash2} disabled={!canManageProducts} onClick={() => deleteProduct(product)} /></div></div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Drawer open={drawer} onClose={() => setDrawer(false)} title={editingProduct ? `Modifier ${editingProduct.name}` : "Nouveau produit"}>
        <form onSubmit={handleSubmit(saveProduct)} className="space-y-5">
          <Card className="overflow-hidden">
            <img src={imagePreview} alt="Apercu produit" className="h-48 w-full object-cover" />
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-gold/15 p-4 text-copper"><ImagePlus /></div>
                <div>
                  <h3 className="font-black dark:text-cream">Image produit</h3>
                  <p className="text-sm text-elegant">Chargez une image depuis votre PC ou collez une URL.</p>
                </div>
              </div>
              <label className="mt-4 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold text-ink shadow-sm transition hover:border-gold dark:border-white/10 dark:bg-white/10 dark:text-cream">
                <Upload size={17} />
                {uploadingImage ? "Chargement..." : "Uploader image"}
                <input type="file" accept="image/*" className="hidden" onChange={uploadProductImage} disabled={uploadingImage} />
              </label>
            </div>
          </Card>
          <Input label="Nom" {...register("name")} error={errors.name?.message} />
          <Input label="Description" {...register("description")} />
          <Select label="Categorie" {...register("categoryId")} options={categoryOptions.length ? categoryOptions : [{ value: "", label: "Aucune categorie" }]} />
          <Input label="URL image" {...register("image")} placeholder="https://... ou URL generee apres upload" />
          <div className="grid grid-cols-2 gap-3"><Input label="Prix" type="number" step="0.01" {...register("price")} error={errors.price?.message} /><Input label="Temps prep." type="number" {...register("preparationTime")} /></div>
          <Input label="TVA" type="number" step="0.01" {...register("tva")} />
          <Button className="w-full" icon={Save} loading={isSubmitting} disabled={!canManageProducts}>{editingProduct ? "Enregistrer les modifications" : "Creer le produit"}</Button>
        </form>
      </Drawer>
    </div>
  );
};
