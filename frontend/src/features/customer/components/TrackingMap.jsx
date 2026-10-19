import DeliveryRouteMap from "../../../components/common/DeliveryRouteMap";

export default function TrackingMap({ deliveryId }) {
  return (
    <DeliveryRouteMap
      key={deliveryId || "no-parcel"}
      deliveryId={deliveryId}
    />
  );
}