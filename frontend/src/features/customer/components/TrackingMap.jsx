import DeliveryRouteMap from "../../../components/common/DeliveryRouteMap";

export default function TrackingMap({ deliveryId, onJourney }) {
  return (
    <DeliveryRouteMap
      key={deliveryId || "no-parcel"}
      deliveryId={deliveryId}
      onJourney={onJourney}
    />
  );
}